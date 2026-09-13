(function () {
  "use strict";

  // ---- Преводи (i18n) ----
  var I18N = {
    en: {
      language: "Language", currency: "Currency",
      campaignStart: "Campaign Start", campaignEnd: "Campaign End",
      totalRevenue: "Total Revenue", avgOrder: "Avg. Order Value",
      months: "Months", prospects: "Prospects", leads: "Leads", customers: "Customers",
      leadRate: "Lead Response Rate", prospectRate: "Prospect Response Rate",
      people: "people", month: "Month", noData: "Enter valid data to see the forecast.",
      usd: "$ US Dollar", eur: "€ Euro", bgn: "лв. Lev", gbp: "£ Pound"
    },
    bg: {
      language: "Език", currency: "Валута",
      campaignStart: "Начало на кампанията", campaignEnd: "Край на кампанията",
      totalRevenue: "Общ оборот", avgOrder: "Средна стойност на поръчката",
      months: "Месеци", prospects: "Контакти", leads: "Потенц. клиенти", customers: "Клиенти",
      leadRate: "Отговори от потенц. клиенти", prospectRate: "Отговори от контакти",
      people: "души", month: "Месец", noData: "Въведете валидни данни, за да видите прогнозата.",
      usd: "$ Долар", eur: "€ Евро", bgn: "лв. Лев", gbp: "£ Паунд"
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    language: $("language"), currency: $("currency"),
    startDate: $("startDate"), endDate: $("endDate"),
    revenue: $("revenue"), avgOrder: $("avgOrder"),
    leadRate: $("leadRate"), prospectRate: $("prospectRate"),
    leadRateVal: $("leadRateVal"), prospectRateVal: $("prospectRateVal"),
    prospectsVal: $("prospectsVal"), leadsVal: $("leadsVal"), customersVal: $("customersVal"),
    prospectsPct: $("prospectsPct"), leadsPct: $("leadsPct"), customersPct: $("customersPct"),
    prospectsFill: $("prospectsFill"), leadsFill: $("leadsFill"), customersFill: $("customersFill"),
    chartRows: $("chartRows"), chartXAxis: $("chartXAxis"), chartEmpty: $("chartEmpty"),
    tooltip: $("tooltip")
  };

  var lang = "en";
  var t = function (key) { return (I18N[lang] && I18N[lang][key]) || key; };
  var nf = function () { return new Intl.NumberFormat(lang === "bg" ? "bg-BG" : "en-US"); };

  // ---- Брой месеци между двете дати (мин. 1) ----
  function monthsBetween(start, end) {
    var s = new Date(start), e = new Date(end);
    if (isNaN(s) || isNaN(e)) { return 6; }
    var m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    return m > 0 ? m : 1;
  }

  // ---- Основните формули от заданието ----
  function compute() {
    var revenue = parseFloat(els.revenue.value);
    var avgOrder = parseFloat(els.avgOrder.value);
    var leadRate = parseFloat(els.leadRate.value);     // клиенти -> потенциални клиенти
    var prospectRate = parseFloat(els.prospectRate.value); // потенц. клиенти -> контакти

    if (!(revenue > 0) || !(avgOrder > 0) || !(leadRate > 0) || !(prospectRate > 0)) {
      return null;
    }
    var customers = revenue / avgOrder;                 // Формула 01
    var leads = (customers * 100) / leadRate;           // Формула 02
    var prospects = (leads * 100) / prospectRate;       // Формула 03
    return { customers: customers, leads: leads, prospects: prospects };
  }

  // ---- Обновяване на трите карти ----
  function renderStats(r) {
    var fmt = nf();
    els.prospectsVal.textContent = fmt.format(Math.round(r.prospects));
    els.leadsVal.textContent = fmt.format(Math.round(r.leads));
    els.customersVal.textContent = fmt.format(Math.round(r.customers));

    var leadPct = (r.leads / r.prospects) * 100;
    var custPct = (r.customers / r.prospects) * 100;
    els.prospectsPct.textContent = "100%";
    els.leadsPct.textContent = Math.round(leadPct) + "%";
    els.customersPct.textContent = Math.round(custPct) + "%";
    els.prospectsFill.style.width = "100%";
    els.leadsFill.style.width = leadPct + "%";
    els.customersFill.style.width = custPct + "%";
  }

  // ---- Кумулативна месечна графика ----
  function renderChart(r) {
    var months = monthsBetween(els.startDate.value, els.endDate.value);
    var axisMax = niceScale(r.prospects); // закръглен максимум — за баровете и за оста
    var fmt = nf();

    els.chartRows.innerHTML = "";
    for (var m = 1; m <= months; m++) {
      var p = Math.round((r.prospects * m) / months);
      var l = Math.round((r.leads * m) / months);
      var c = Math.round((r.customers * m) / months);

      var row = document.createElement("div");
      row.className = "chart__row";
      row.innerHTML =
        '<span class="chart__ylabel">' + m + '</span>' +
        '<div class="chart__track">' +
          '<div class="bar bar--prospects" style="width:' + (p / axisMax * 100) + '%"></div>' +
          '<div class="bar bar--leads" style="width:' + (l / axisMax * 100) + '%"></div>' +
          '<div class="bar bar--customers" style="width:' + (c / axisMax * 100) + '%"></div>' +
        '</div>';

      (function (mi, pv, lv, cv) {
        row.addEventListener("mousemove", function (e) { showTip(e, mi, pv, lv, cv); });
        row.addEventListener("mouseleave", hideTip);
      })(m, p, l, c);

      els.chartRows.appendChild(row);
    }

    // X-ос: 0 .. закръгления максимум (5 равни стъпки)
    els.chartXAxis.innerHTML = "";
    for (var i = 0; i <= 5; i++) {
      var val = Math.round((axisMax / 5) * i);
      var span = document.createElement("span");
      span.textContent = fmt.format(val) + " " + t("people");
      els.chartXAxis.appendChild(span);
    }
  }

  // Закръгля максимума до "красиво" число (стъпки 1/2/2.5/5 x 10^k)
  function niceScale(maxVal) {
    var ticks = 5;
    var rawStep = maxVal / ticks;
    var mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    var norm = rawStep / mag;
    var step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    step *= mag;
    return Math.ceil(maxVal / step) * step;
  }

  function showTip(e, m, p, l, c) {
    els.tooltip.innerHTML =
      "<strong>" + t("month") + " #" + m + "</strong><br>" +
      t("prospects") + ": " + p + "<br>" +
      t("leads") + ": " + l + "<br>" +
      t("customers") + ": " + c;
    els.tooltip.hidden = false;
    els.tooltip.style.left = (e.clientX + 14) + "px";
    els.tooltip.style.top = (e.clientY + 14) + "px";
  }
  function hideTip() { els.tooltip.hidden = true; }

  // ---- Смяна на валута / език ----
  function applyCurrency() {
    var sym = els.currency.value;
    var nodes = document.querySelectorAll("[data-currency]");
    for (var i = 0; i < nodes.length; i++) { nodes[i].textContent = sym; }
  }
  function applyLanguage() {
    lang = els.language.value;
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    }
  }

  // ---- Главна функция за обновяване ----
  function update() {
    els.leadRateVal.textContent = parseFloat(els.leadRate.value).toFixed(2) + "%";
    els.prospectRateVal.textContent = parseFloat(els.prospectRate.value).toFixed(2) + "%";

    var r = compute();
    if (!r) {
      els.chartRows.innerHTML = "";
      els.chartXAxis.innerHTML = "";
      els.chartEmpty.hidden = false;
      return;
    }
    els.chartEmpty.hidden = true;
    renderStats(r);
    renderChart(r);
  }

  // ---- Слушатели ----
  ["revenue", "avgOrder", "leadRate", "prospectRate", "startDate", "endDate"].forEach(function (id) {
    els[id].addEventListener("input", update);
  });
  els.currency.addEventListener("change", function () { applyCurrency(); });
  els.language.addEventListener("change", function () { applyLanguage(); update(); });

  // ---- Старт ----
  applyCurrency();
  applyLanguage();
  update();
})();
