(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    revenue: $("revenue"), avgOrder: $("avgOrder"),
    leadRate: $("leadRate"), prospectRate: $("prospectRate"),
    leadRateVal: $("leadRateVal"), prospectRateVal: $("prospectRateVal"),
    prospectsVal: $("prospectsVal"), leadsVal: $("leadsVal"), customersVal: $("customersVal"),
    prospectsPct: $("prospectsPct"), leadsPct: $("leadsPct"), customersPct: $("customersPct"),
    prospectsFill: $("prospectsFill"), leadsFill: $("leadsFill"), customersFill: $("customersFill")
  };

  var nf = function () { return new Intl.NumberFormat("en-US"); };

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

  // ---- Главна функция за обновяване ----
  function update() {
    els.leadRateVal.textContent = parseFloat(els.leadRate.value).toFixed(2) + "%";
    els.prospectRateVal.textContent = parseFloat(els.prospectRate.value).toFixed(2) + "%";

    var r = compute();
    if (!r) { return; }
    renderStats(r);
  }

  // ---- Слушатели ----
  ["revenue", "avgOrder", "leadRate", "prospectRate"].forEach(function (id) {
    els[id].addEventListener("input", update);
  });

  // ---- Старт ----
  update();
})();
