document.addEventListener("DOMContentLoaded", async () => {
  // Login Elements
  const loginOverlay = document.getElementById("login-overlay");
  const dashboardApp = document.getElementById("dashboard-app");
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("login-error");

  // Check if already authenticated in this session
  const isAuthenticated = sessionStorage.getItem("autta_dash_auth");

  if (isAuthenticated === "true") {
    // Show dashboard directly
    loginOverlay.classList.add("hidden");
    dashboardApp.style.display = "flex";
    initDashboard();
  } else {
    // Setup login form listener
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = usernameInput.value.trim();
      const pass = passwordInput.value;

      if (user === "Luiz" && pass === "Senhapadrao2025@") {
        // Correct credentials
        sessionStorage.setItem("autta_dash_auth", "true");
        loginOverlay.classList.add("hidden");
        dashboardApp.style.display = "flex";
        initDashboard();
      } else {
        // Invalid credentials
        loginError.classList.remove("hidden");
        passwordInput.value = "";
      }
    });
  }

  // Dashboard Initialization Logic (Wrapped in a function)
  function initDashboard() {
    // 1. Initialize Supabase
  // Using the credentials provided by the MCP
  const SUPABASE_URL = "https://wekitunzajamdveyvoss.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2l0dW56YWphbWR2ZXl2b3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzk1MjcsImV4cCI6MjA4NTk1NTUyN30.gOx2rpZVGRoMJc-iAe8COsB8Mq88JcyVN0QBL-cjctk";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // DOM Elements
  const elSent = document.getElementById("kpi-sent");
  const elOpened = document.getElementById("kpi-opened");
  const elOpenedPct = document.getElementById("kpi-opened-pct");
  const elDisparos = document.getElementById("kpi-disparos");
  const elResponses = document.getElementById("kpi-responses");
  const elResponsesPct = document.getElementById("kpi-responses-pct");

  // Filter Elements
  const presetSelect = document.getElementById("date-preset");
  const customDateGroup = document.getElementById("custom-date-group");
  const dateStartInput = document.getElementById("date-start");
  const dateEndInput = document.getElementById("date-end");

  // Helper: Get Date Range based on selected filter
  function getDateRange() {
    const preset = presetSelect.value;
    const now = new Date();
    let startDate = null;
    let endDate = now.toISOString();

    if (preset === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString();
    } else if (preset === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString();
    } else if (preset === "thisMonth") {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = d.toISOString();
    } else if (preset === "custom") {
      if (dateStartInput.value) {
        startDate = new Date(dateStartInput.value).toISOString();
      }
      if (dateEndInput.value) {
        // Adjust end date to the end of the day
        const d = new Date(dateEndInput.value);
        d.setHours(23, 59, 59, 999);
        endDate = d.toISOString();
      }
    } else if (preset === "all") {
      startDate = null; // No start date filter
      endDate = null;   // No end date filter
    }

    return { startDate, endDate };
  }

  // Handle Preset Change
  presetSelect.addEventListener("change", (e) => {
    if (e.target.value === "custom") {
      customDateGroup.style.display = "flex";
      // Set default inputs if empty
      if (!dateStartInput.value || !dateEndInput.value) {
         const today = new Date().toISOString().split("T")[0];
         dateStartInput.value = today;
         dateEndInput.value = today;
      }
    } else {
      customDateGroup.style.display = "none";
      reloadData();
    }
  });

  // Handle Custom Date Change
  [dateStartInput, dateEndInput].forEach(input => {
    input.addEventListener("change", () => {
      if (presetSelect.value === "custom") {
        reloadData();
      }
    });
  });

  function reloadData() {
    fetchKPIs();
    fetchChartData();
  }

  const ctx = document.getElementById("trendChart").getContext("2d");
  let trendChart;

  // Helper: Animate Counter
  const animateValue = (obj, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  // 2. Fetch KPIs
  async function fetchKPIs() {
    try {
      const { startDate, endDate } = getDateRange();
      
      let querySent = supabase.from("data_lead").select("*", { count: "exact", head: true });
      let queryOpened = supabase.from("data_lead").select("*", { count: "exact", head: true }).eq("mail_tracking_status", "opened");
      let queryDisparos = supabase.from("disparos").select("*", { count: "exact", head: true }).eq("whatsapp_enviado", true);
      let queryResponses = supabase.from("disparos").select("*", { count: "exact", head: true }).eq("lead_enviou_mensagem", true);

      // Apply date filters if applicable (Only for 'disparos')
      if (startDate) {
        queryDisparos = queryDisparos.gte("created_at", startDate);
        queryResponses = queryResponses.gte("created_at", startDate);
      }
      if (endDate) {
        queryDisparos = queryDisparos.lte("created_at", endDate);
        queryResponses = queryResponses.lte("created_at", endDate);
      }

      // KPI 1: E-mails Enviados
      const { count: countSent, error: err1 } = await querySent;
      console.log("Supabase - data_lead Total:", countSent, "Error:", err1);
      if (err1) throw err1;
      animateValue(elSent, 0, countSent || 0, 1500);

      // KPI 2: E-mails Abertos
      const { count: countOpened, error: err2 } = await queryOpened;
      console.log("Supabase - data_lead Opened:", countOpened, "Error:", err2);
      if (err2) throw err2;
      animateValue(elOpened, 0, countOpened || 0, 1500);

      // KPI 3: Disparos Realizados
      const { count: countDisparos, error: err3 } = await queryDisparos;
      if (err3) throw err3;
      animateValue(elDisparos, 0, countDisparos || 0, 1500);

      // KPI 4: Respostas (Leads)
      const { count: countResponses, error: err4 } = await queryResponses;

      if (err4) throw err4;
      animateValue(elResponses, 0, countResponses || 0, 1500);

      // Percentages
      const pctOpened = countSent > 0 ? ((countOpened / countSent) * 100).toFixed(1) : 0;
      const pctResponses = countDisparos > 0 ? ((countResponses / countDisparos) * 100).toFixed(1) : 0;
      elOpenedPct.textContent = `${pctOpened}%`;
      elResponsesPct.textContent = `${pctResponses}%`;
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      // Fallback in case of an error to still render 0 visually but notify console
      [elSent, elOpened, elDisparos, elResponses].forEach(
        (el) => { if (el.innerHTML === "-") el.innerHTML = "0 (Erro)"; }
      );
    }
  }

  // 3. Fetch Chart Data
  async function fetchChartData() {
    try {
      const { startDate, endDate } = getDateRange();
      
      let queryChart = supabase
        .from("disparos")
        .select("created_at, lead_enviou_mensagem");

      if (startDate) {
        queryChart = queryChart.gte("created_at", startDate);
      }
      if (endDate) {
        queryChart = queryChart.lte("created_at", endDate);
      }

      const { data, error } = await queryChart;
      if (error) throw error;

      // Process Data: Group by Day
      const dailyData = {};

      // If "All" or "This Month", the range might be large. Let's dynamically establish the last X days based on data length, or fill gaps between min/max date.
      // For simplicity and keeping the "tendency trend" visual, we will build a map of dates from the data.
      let numDays = 7;
      let refDate = new Date();
      
      const preset = presetSelect.value;
      if (preset === "30d") numDays = 30;
      else if (preset === "thisMonth") numDays = new Date().getDate(); // Days passed this month
      else if (preset === "custom") {
         if (startDate && endDate) {
            const startStr = startDate.split("T")[0];
            const endStr = endDate.split("T")[0];
            const diffTime = Math.abs(new Date(endStr) - new Date(startStr));
            numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            refDate = new Date(endStr);
         } else {
             numDays = 7;
         }
      } else if (preset === "all") {
          // Find earliest date
          if (data && data.length > 0) {
              const earliest = data.reduce((min, p) => p.created_at < min ? p.created_at : min, data[0].created_at);
              const diffTime = Math.abs(new Date() - new Date(earliest));
              numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          } else {
              numDays = 7;
          }
      }

      // Safeguard against too many points on chart
      if (numDays > 60) numDays = 60; // Limit to 60 data points maximum for readability

      // Initialize days with 0 based on reference date backwards
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(refDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        dailyData[dateStr] = { disparos: 0, respostas: 0 };
      }

      // Populate data
      data.forEach((item) => {
        if (item.created_at) {
          const dateStr = item.created_at.split("T")[0];
          if (dailyData[dateStr]) {
            dailyData[dateStr].disparos++;
            if (item.lead_enviou_mensagem) {
              dailyData[dateStr].respostas++;
            }
          }
        }
      });

      // Prepare Chart.js arrays
      const labels = Object.keys(dailyData).map((date) => {
        const parts = date.split("-");
        return `${parts[2]}/${parts[1]}`; // DD/MM
      });
      const dataDisparos = Object.values(dailyData).map((d) => d.disparos);
      const dataRespostas = Object.values(dailyData).map((d) => d.respostas);

      renderChart(labels, dataDisparos, dataRespostas);
    } catch (error) {
      console.error("Error fetching Chart Data:", error);
    }
  }

  // 4. Render Chart
  function renderChart(labels, disparos, respostas) {
    if (trendChart) {
      trendChart.destroy();
    }

    // Apply a glowing gradient for the primary line
    let gradientDisparos = ctx.createLinearGradient(0, 0, 0, 400);
    gradientDisparos.addColorStop(0, "rgba(107, 70, 193, 0.8)");
    gradientDisparos.addColorStop(1, "rgba(107, 70, 193, 0.0)");

    let gradientRespostas = ctx.createLinearGradient(0, 0, 0, 400);
    gradientRespostas.addColorStop(0, "rgba(16, 185, 129, 0.8)");
    gradientRespostas.addColorStop(1, "rgba(16, 185, 129, 0.0)");

    Chart.defaults.color = "#a0a8cc";
    Chart.defaults.font.family = "'Inter', sans-serif";

    trendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Disparos",
            data: disparos,
            borderColor: "#6b46c1",
            backgroundColor: gradientDisparos,
            borderWidth: 3,
            pointBackgroundColor: "#6b46c1",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4, // Smooth curves
          },
          {
            label: "Respostas",
            data: respostas,
            borderColor: "#10b981",
            backgroundColor: gradientRespostas,
            borderWidth: 2,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: "rgba(15, 17, 26, 0.9)",
            titleColor: "#fff",
            bodyColor: "#a0a8cc",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            usePointStyle: true,
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
              drawBorder: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
              drawBorder: false,
            },
            ticks: {
              stepSize: 1,
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    });
  }

  // 5. Initial Load
  fetchKPIs();
  fetchChartData();

    // 6. Set up real-time subscriptions
    const setupSubscriptions = () => {
      // Subscribe to changes in data_lead (for Sent / Opened)
      supabase
        .channel("public:data_lead")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "data_lead" },
          (payload) => {
            console.log("Change received in data_lead!", payload);
            fetchKPIs(); // Refresh KPIs on change
          },
        )
        .subscribe();

      // Subscribe to changes in disparos (for Disparos / Responses / Chart)
      supabase
        .channel("public:disparos")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "disparos" },
          (payload) => {
            console.log("Change received in disparos!", payload);
            fetchKPIs();
            fetchChartData();
          },
        )
        .subscribe();
    };

    setupSubscriptions();
  }
});
