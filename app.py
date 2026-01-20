import os
from flask import Flask, render_template, request, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np

# ✅ Vercel-safe upload folder
UPLOAD_FOLDER = "/tmp"
ALLOWED_EXTENSIONS = {"csv"}

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
latest_analysis = {}

CATEGORY_KEYWORDS = {
    "Food": ["zomato","swiggy","restaurant","cafe","coffee","dominos","mcdonald"],
    "Grocery": ["bigbasket","grocery","grocer","supermarket","dmart"],
    "Transport": ["ola","uber","taxi","bus","metro","rail","travel"],
    "Rent": ["rent","landlord"],
    "Bills": ["electricity","water","internet","airtel","jio","bill"],
    "Subscription": ["netflix","prime","spotify","hotstar","zee5"],
    "Shopping": ["flipkart","amazon","myntra","store","shop"],
    "Health": ["clinic","hospital","pharmacy","doctor","medic"],
    "Entertainment": ["movie","cinema","concert","event"]
}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXTENSIONS

def categorize_description(desc):
    if not isinstance(desc,str):
        return "Other"
    s = desc.lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in s:
                return cat
    return "Other"

def process_transactions(df):
    df = df.copy()

    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    else:
        df["date"] = pd.NaT

    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0).abs()

    if "type" not in df.columns:
        df["type"] = "debit"

    df["type"] = df["type"].astype(str).str.lower()
    df["category"] = df["description"].apply(categorize_description)
    df["month"] = df["date"].dt.to_period("M").astype(str).fillna("unknown")

    debits = df[df["type"].str.contains("debit")]
    credits = df[df["type"].str.contains("credit")]

    monthly_spending = debits.groupby("month")["amount"].sum().sort_index().to_dict()
    avg_monthly_spending = float(np.mean(list(monthly_spending.values()))) if monthly_spending else 0.0
    monthly_income = float(credits.groupby("month")["amount"].sum().mean()) if len(credits)>0 else None
    category_totals = debits.groupby("category")["amount"].sum().sort_values(ascending=False).to_dict()
    recurring = df["description"].value_counts().head(10).to_dict()

    return {
        "monthly_spending": monthly_spending,
        "avg_monthly_spending": avg_monthly_spending,
        "estimated_monthly_income": monthly_income,
        "category_totals": category_totals,
        "recurring": recurring,
        "raw_rows": df.to_dict(orient="records")
    }

@app.route("/")
def landing():
    return render_template("landing.html")

@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/upload", methods=["POST"])
def upload():
    global latest_analysis

    if "file" not in request.files:
        return "No file part", 400

    file = request.files["file"]

    if file.filename == "":
        return "No selected file", 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(path)

        df = pd.read_csv(path)
        latest_analysis = process_transactions(df)

        return redirect(url_for("dashboard"))

    return "Invalid file", 400

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/api/summary")
def api_summary():
    return jsonify(latest_analysis)

@app.route("/api/check_goal", methods=["POST"])
def api_check_goal():
    data = request.get_json() or {}

    goal_amount = float(data.get("goal_amount",0))
    months = int(data.get("months",1))
    monthly_income = data.get("monthly_income")

    if monthly_income is not None:
        monthly_income = float(monthly_income)

    analysis = latest_analysis or {}
    avg_spending = analysis.get("avg_monthly_spending",0.0)
    estimated_income = analysis.get("estimated_monthly_income")

    if monthly_income is None and estimated_income is not None:
        monthly_income = float(estimated_income)

    if monthly_income is None:
        return jsonify({"error":"monthly_income required."}),400

    current_savings = max(0.0, monthly_income - avg_spending)
    needed_savings = goal_amount / months
    feasible = current_savings >= needed_savings
    months_needed = (goal_amount / current_savings) if current_savings>0 else None

    suggestions = []

    if not feasible:
        top_cats = list(analysis.get("category_totals",{}).items())[:3]
        for cat, amt in top_cats:
            suggestions.append(f"Reduce {cat} by 10% (≈ ₹{round(amt*0.1,2)})")
    else:
        suggestions.append("You're on track! Keep saving consistently.")

    return jsonify({
        "feasible": feasible,
        "current_monthly_savings": round(current_savings,2),
        "needed_monthly_savings": round(needed_savings,2),
        "months_needed_at_current_rate": round(months_needed,1) if months_needed else None,
        "suggestions": suggestions
    })
