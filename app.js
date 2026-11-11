let currentLang = 'ru';

function setLang(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.lang-btn[onclick="setLang('${lang}')"]`).classList.add('active');
    
    const t = translations[lang];
    
    document.getElementById('title-text').innerText = t.title;
    document.getElementById('btn-tab-favor').innerText = t.navFavor;
    document.getElementById('btn-tab-prof').innerText = t.navProf;
    document.getElementById('btn-tab-soon').innerText = t.navSoon;
    
    document.getElementById('lbl-maxLevel').innerText = t.lblMaxLevel;
    document.getElementById('lbl-sortBy').innerText = t.lblSortBy;
    document.getElementById('opt-level').innerText = t.optLevel;
    document.getElementById('opt-costAsc').innerText = t.optCostAsc;
    document.getElementById('opt-costDesc').innerText = t.optCostDesc;
    document.getElementById('opt-name').innerText = t.optName;
    document.getElementById('lbl-onlyBest').innerText = t.lblOnlyBest;
    document.getElementById('th-crate').innerText = t.thCrate;
    document.getElementById('th-res-name').innerText = t.thResName;
    document.getElementById('th-price-item').innerText = t.thPriceItem;
    document.getElementById('th-price-total').innerText = t.thPriceTotal;
    document.getElementById('th-cost-favor').innerText = t.thCostFavor;
    document.getElementById('th-cost-net').innerText = t.thCostNet;
    
    document.getElementById('lbl-profession').innerText = t.lblProfession;
    document.getElementById('opt-bs').innerText = t.optBS;
    document.getElementById('lbl-current').innerText = t.lblCurrent;
    document.getElementById('lbl-target').innerText = t.lblTarget;
    document.getElementById('btn-update-prof').innerText = t.btnUpdate;
    document.getElementById('th-skill').innerText = t.thSkill;
    document.getElementById('th-recipe').innerText = t.thRecipe;
    document.getElementById('th-mats').innerText = t.thMats;
    document.getElementById('th-crafts').innerText = t.thCrafts;
    document.getElementById('th-total-prof').innerText = t.thTotalProf;

    renderFavorTable(); 
    renderProfessions();
}

function formatWoWMoney(copperValue) {
    if (copperValue === null || copperValue === undefined || isNaN(copperValue)) return '—';
    const isNegative = copperValue < 0;
    const copper = Math.abs(Math.round(copperValue));
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const remainingCopper = copper % 100;
    const goldIcon = '<img src="https://wow.zamimg.com/images/wow/icons/medium/inv_misc_coin_01.jpg" class="coin-icon">';
    const silverIcon = '<img src="https://wow.zamimg.com/images/wow/icons/medium/inv_misc_coin_03.jpg" class="coin-icon">';
    const copperIcon = '<img src="https://wow.zamimg.com/images/wow/icons/medium/inv_misc_coin_05.jpg" class="coin-icon">';
    let result = '';
    if (gold > 0) result += `${gold} ${goldIcon} `;
    if (silver > 0 || (gold > 0 && remainingCopper > 0)) result += `${silver} ${silverIcon} `;
    if (remainingCopper > 0 || (gold === 0 && silver === 0)) result += `${remainingCopper} ${copperIcon}`;
    let formatted = result.trim();
    if (isNegative && formatted !== '') formatted = '-' + formatted;
    return formatted || '0';
}

function getPrice(itemId) {
    if (window.AUCTION_DATA && window.AUCTION_DATA[String(itemId)] !== undefined) {
        return window.AUCTION_DATA[String(itemId)];
    }
    return null;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById('btn-tab-' + tabId).classList.add('active');
}

// --- РЕНДЕР ТОРГОВЫХ ОБЯЗАТЕЛЬСТВ ---
function renderFavorTable() {
    const t = translations[currentLang];
    const tableBody = document.getElementById('favorBody');
    tableBody.innerHTML = '';
    
    const maxLevel = parseInt(document.getElementById('maxLevel').value) || 60;
    const sortBy = document.getElementById('sortBy').value;
    const onlyBest = document.getElementById('onlyBest').checked;

    let preparedData = [];

    cratesData.filter(c => c.level <= maxLevel).forEach(crate => {
        const cratePrice = getPrice(crate.id) || 0;
        const crateOptions = [];
        
        crate.options.forEach(opt => {
            // Теперь opt.id - это прямой ID предмета
            const itemInfo = itemDB[opt.id];
            const price = getPrice(opt.id);

            let totalCost = null, costPerFavor = null, netCostPerFavor = null;
            if (price !== null) {
                totalCost = (price * opt.qty) + cratePrice;
                costPerFavor = totalCost / crate.favor;
                if (crate.gold_reward !== undefined) {
                    netCostPerFavor = (totalCost - crate.gold_reward) / crate.favor;
                }
            }
            crateOptions.push({ id: opt.id, qty: opt.qty, price, totalCost, costPerFavor, netCostPerFavor });
        });
        
        crateOptions.sort((a, b) => (a.netCostPerFavor === null) ? 1 : (b.netCostPerFavor === null) ? -1 : a.netCostPerFavor - b.netCostPerFavor);
        const validOptions = crateOptions.filter(o => o.netCostPerFavor !== null);
        const bestCost = validOptions.length > 0 ? validOptions[0].netCostPerFavor : Infinity;
        
        preparedData.push({ ...crate, price: cratePrice, options: crateOptions, bestCost });
    });

    preparedData.sort((a, b) => {
        if (sortBy === 'level') return a.level - b.level;
        if (sortBy === 'costAsc') return a.bestCost === Infinity ? 1 : b.bestCost === Infinity ? -1 : a.bestCost - b.bestCost;
        if (sortBy === 'costDesc') return a.bestCost === Infinity ? 1 : b.bestCost === Infinity ? -1 : b.bestCost - a.bestCost;
        if (sortBy === 'name') return a.name_ru.localeCompare(b.name_ru);
        return 0;
    });

    preparedData.forEach(crate => {
        const tr = document.createElement('tr');
        const rarityClass = crate.rarity === 'uncommon' ? 'uncommon' : 'common';
        
        const crateCellHtml = `
            <td class="crate-cell">
                <div class="crate-content">
                    <div class="crate-name">
                        <a href="#" onclick="return false;" class="icon-link" style="justify-content: center;">
                            <div class="icon-wrapper ${rarityClass}" style="width: 36px; height: 36px;">
                                <img src="https://wow.zamimg.com/images/wow/icons/medium/${crate.icon}.jpg" class="item-icon" style="width: 100%; height: 100%;">
                            </div>
                            ${crate.name_ru}
                        </a>
                    </div>
                    <div class="crate-meta">
                        <div>${t.crateLevel} <strong>${crate.level}</strong></div>
                        <div>${t.crateFavor} <strong>${crate.favor} Favor</strong></div>
                        <div style="color: var(--gold);">${t.crateGoldReward} <strong>${formatWoWMoney(crate.gold_reward)}</strong></div>
                        <div>${t.cratePrice} <strong>${crate.price ? formatWoWMoney(crate.price) : t.noPrice}</strong></div>
                    </div>
                </div>
            </td>
        `;
        
        let resourcesHtml = '<td class="resources-container">';
        let optionsToShow = onlyBest ? [crate.options[0]] : crate.options;

        const validOptions = crate.options.filter(o => o.netCostPerFavor !== null);
        const bestCost = validOptions.length > 0 ? validOptions[0].netCostPerFavor : 0;
        const worstCost = validOptions.length > 0 ? validOptions[validOptions.length - 1].netCostPerFavor : 0;
        const diff = worstCost - bestCost;

        optionsToShow.forEach(opt => {
            const itemInfo = itemDB[opt.id];
            let rowClass = 'row-mid', textClass = 'profit-text-mid', netTextClass = '';
            
            if (opt.netCostPerFavor !== null) {
                if (opt.netCostPerFavor < 0) { rowClass = 'row-high'; textClass = 'profit-text-high'; netTextClass = 'profit-negative'; }
                else if (onlyBest || opt.netCostPerFavor === bestCost || (diff > 0 && opt.netCostPerFavor < bestCost + (diff * 0.3))) { rowClass = 'row-high'; textClass = 'profit-text-high'; }
                else if (opt.netCostPerFavor === worstCost || (diff > 0 && opt.netCostPerFavor > worstCost - (diff * 0.3))) { rowClass = 'row-low'; textClass = 'profit-text-low'; }
            } else { rowClass = ''; textClass = 'text-muted'; }

            resourcesHtml += `
                <div class="resource-row ${rowClass}">
                    <a href="#" onclick="return false;" class="icon-link">
                        <div class="icon-wrapper common">
                            <img src="https://wow.zamimg.com/images/wow/icons/medium/${itemInfo ? itemInfo.icon : 'inv_misc_questionmark'}.jpg" class="item-icon">
                        </div>
                        <span style="font-weight: 500;">${itemInfo ? itemInfo.name_ru : 'Unknown'} × ${opt.qty}</span>
                    </a>
                    <div class="price-info">
                        <span class="col-price" style="color: #a6adc8;">${opt.price !== null ? formatWoWMoney(opt.price) : t.noPrice}</span>
                        <span class="col-total">${opt.totalCost !== null ? formatWoWMoney(opt.totalCost) : t.noPrice}</span>
                        <span class="col-favor ${textClass}">${opt.costPerFavor !== null ? formatWoWMoney(opt.costPerFavor) : t.noPrice}</span>
                        <span class="col-net ${netTextClass || textClass}" style="font-size: 1.1em;">${opt.netCostPerFavor !== null ? formatWoWMoney(opt.netCostPerFavor) : t.noPrice}</span>
                    </div>
                </div>
            `;
        });
        resourcesHtml += '</td>';
        tr.innerHTML = crateCellHtml + resourcesHtml;
        tableBody.appendChild(tr);
    });
}

// --- РЕНДЕР ПРОФЕССИЙ ---
function renderProfessions() {
    const t = translations[currentLang];
    const currentSkill = parseInt(document.getElementById('currentSkill').value) || 1;
    const targetSkill = parseInt(document.getElementById('targetSkill').value) || 300;
    const tbody = document.getElementById('profBody');
    tbody.innerHTML = '';

    let grandTotalCost = 0;
    let hasMissingPrices = false;

    blacksmithingRoute.forEach(step => {
        const [start, end, name_ru, name_en, icon, materials, isTrainer] = step;
        if (end <= currentSkill || start >= targetSkill) return;

        const craftsNeeded = end - start;
        let stepTotalCost = 0;
        let materialsHtml = '';

        for (const [matId, qty] of Object.entries(materials)) {
            const price = getPrice(matId);
            const totalMatCost = price ? price * qty * craftsNeeded : 0;
            if (price === null) hasMissingPrices = true;
            stepTotalCost += totalMatCost;
            
            const matName = itemDB[matId] ? itemDB[matId].name_ru : `Item ${matId}`;
            const matIcon = itemDB[matId] ? itemDB[matId].icon : 'inv_misc_questionmark';
            const priceDisplay = price !== null ? formatWoWMoney(price) : '—';

            materialsHtml += `
                <div class="material-item">
                    <span>
                        <img src="https://wow.zamimg.com/images/wow/icons/small/${matIcon}.jpg" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                        ${matName} × ${qty}
                    </span>
                    <span class="material-cost">${priceDisplay}</span>
                </div>
            `;
        }

        grandTotalCost += stepTotalCost;
        const recipeName = currentLang === 'ru' ? name_ru : name_en;

        const tr = document.createElement('tr');
        tr.className = 'prof-step-row';
        tr.innerHTML = `
            <td class="skill-range">${start} - ${end}</td>
            <td class="recipe-name">
                <span style="margin-right: 8px;">${isTrainer ? '📖' : '💰'}</span>
                <img src="https://wow.zamimg.com/images/wow/icons/small/${icon}.jpg" class="item-icon-small">
                ${recipeName}
            </td>
            <td><div class="materials-list">${materialsHtml}</div></td>
            <td>${craftsNeeded} шт.</td>
            <td class="material-cost">${stepTotalCost > 0 ? formatWoWMoney(stepTotalCost) : '—'}</td>
        `;
        tbody.appendChild(tr);
    });

    const totalTr = document.createElement('tr');
    totalTr.className = 'total-cost-row';
    totalTr.innerHTML = `<td colspan="4" style="text-align: right;">${t.totalRoute}</td><td class="material-cost">${grandTotalCost > 0 ? formatWoWMoney(grandTotalCost) : '—'}</td>`;
    tbody.appendChild(totalTr);

    if (hasMissingPrices) {
        const warnTr = document.createElement('tr');
        warnTr.innerHTML = `<td colspan="5" style="color: var(--red); text-align: center; font-size: 0.9em;">${t.missingPrices}</td>`;
        tbody.appendChild(warnTr);
    }
}

window.onload = () => { 
    setLang('ru'); 
};

document.getElementById('maxLevel').addEventListener('change', renderFavorTable);
document.getElementById('sortBy').addEventListener('change', renderFavorTable);
document.getElementById('onlyBest').addEventListener('change', renderFavorTable);
