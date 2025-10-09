// Fetch transaction summary from backend
async function fetchSummary() {
  try {
    const res = await fetch('/api/summary');
    if (!res.ok) return {};
    return res.json();
  } catch (err) {
    console.error("Error fetching summary:", err);
    return {};
  }
}

// Draw bar chart for monthly spending
function drawBarChart(monthlyData) {
  if (!monthlyData) return;
  const ctx = document.getElementById('lineChart').getContext('2d');
  const months = Object.keys(monthlyData);
  const amounts = Object.values(monthlyData);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Monthly Spending',
        data: amounts,
        backgroundColor: '#4CAF50'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top' } },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Draw pie chart for category spending
function drawPieChart(categoryData) {
  if (!categoryData) return;
  const ctx = document.getElementById('pieChart').getContext('2d');
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  const colors = ['#4CAF50','#FF6384','#36A2EB','#FFCE56','#9C27B0','#FF9800','#00BCD4','#FFC107','#8BC34A','#FF5722'];

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } }
    }
  });
}

// Handle goal checking form
document.addEventListener('DOMContentLoaded', async () => {
  const summary = await fetchSummary();

  if (summary.monthly_spending) drawBarChart(summary.monthly_spending);
  if (summary.category_totals) drawPieChart(summary.category_totals);

  const form = document.getElementById('goalForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const goal_amount = parseFloat(document.getElementById('goal_amount').value);
    const months = parseInt(document.getElementById('months').value);
    const monthly_income_val = document.getElementById('monthly_income').value;
    const monthly_income = monthly_income_val ? parseFloat(monthly_income_val) : null;

    try {
      const res = await fetch('/api/check_goal', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({goal_amount, months, monthly_income})
      });

      const data = await res.json();
      const out = document.getElementById('goalResult');

      if (data.error) {
        out.innerText = data.error;
        return;
      }

      let text = `Feasible: ${data.feasible ? 'Yes ✅' : 'No ❌'}\n`;
      text += `Current Monthly Savings: ₹${data.current_monthly_savings}\n`;
      text += `Needed Monthly Savings: ₹${data.needed_monthly_savings}\n`;
      if (data.months_needed_at_current_rate) text += `Months needed at current savings: ${data.months_needed_at_current_rate}\n`;
      text += '\nSuggestions:\n';
      data.suggestions.forEach(s => { text += `- ${s}\n`; });
      out.innerText = text;

    } catch (err) {
      console.error("Error checking goal:", err);
      document.getElementById('goalResult').innerText = "Error checking goal.";
    }
  });
});
