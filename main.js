var initialGameData = {
    money: 0,
    totalPrinted: 0,
    moneyPerClick: 1,
    moneyPerClickUpgradeCost: 10,
    lastTick: Date.now(),
    intern: {
        qty: 0,
        upgradeLevel: 0,
    },
    printer: {
        qty: 0,
        upgradeLevel: 0,
    },
    politician: {
        qty: 0,
        upgradeLevel: 0,
    },
    specialProjects: {
        sp001: false,
        sp002: false,
        sp003: false,
        sp004: false,
        sp005: false
    },
    politicalPower: {
        amount: 0,
        slider: 0,
        cost: 1000
    }
}

// Generator(baseCost, baseOutput, qtyCostAdd, qtyCostMulti, baseUpgradeCost, upgradeCostAdd, upgradeCostMulti, upgradeOutputMulti)
const generators = {
    intern: new Generator({
        baseCost: 7.25,
        baseOutput:  0.5,
        qtyCostAdd:  1.75,
        qtyCostMulti:  1.4,
        baseUpgradeCost:  100,
        upgradeCostAdd:  30,
        upgradeCostMulti:  1.07,
        // baseUpgradePPCost:  0,
        // upgradePPCostAdd:  0,
        // upgradePPCostMulti:  1,
        upgradeOutputMulti:  1.07
    }),
    printer: new Generator({
        baseCost:  80,
        baseOutput:  5,
        // qtyCostAdd:  0,
        qtyCostMulti:  1.4,
        baseUpgradeCost:  2000,
        upgradeCostAdd:  0,
        upgradeCostMulti:  1.5,
        // baseUpgradePPCost:  0,
        // upgradePPCostAdd:  0,
        // upgradePPCostMulti:  1,
        upgradeOutputMulti:  1.1355
    }),
    politician: new Generator({
        baseCost:  2000,
        baseOutput:  16,
        // qtyCostAdd:  0,
        qtyCostMulti:  17.76,
        // baseUpgradeCost:  0,
        // upgradeCostAdd:  0,
        // upgradeCostMulti:  1,
        baseUpgradePPCost:  6,
        // upgradePPCostAdd:  0,
        upgradePPCostMulti:  1.4,
        upgradeOutputMulti:  1.3
    }),
}

var gameData = initialGameData
var ppSlider = document.getElementById("politicalSlider");

///
/// Debug Functions
///

function reset() {
    gameData = initialGameData
    ppSlider.value = gameData.politicalPower.slider  // visually update slider
    updateEverything()
}

function showMeTheMoney(amt=1e11) {
    // use brr(n) to simulate clicking that many times instead
    // this function doesn't add to totalPrinted 
    gameData.money += amt  // 100 billion default
    updateMoney()
}


function bankruptcy() {
    gameData.money = 0
    updateMoney()
}

//
// Update Functions
//

function update(id, content) {
    document.getElementById(id).innerHTML = content
}

function updateEverything() {  // call on load
    updateMoney()
    updatePP()
    updateIncome()
    updatePerClickUpgrade()
    updatehandPrintButton()
    updateAssetInfo('intern')
    updateAssetInfo('printer')
    updateAssetInfo('politician')
    viewSpecialProjects()
    updateMenuButtons()
    saveGame()
}

function updateMoney() {
    update("currentMoney", "Current Money: $" + format(gameData.money, "money"))
}

function updatePP() {
    document.getElementById("ppView").style.display = "none"
    document.getElementById("manage-politicians").style.display = "none"
    if (gameData.specialProjects.sp002) {
        document.getElementById("ppView").style.display = "inline"
        document.getElementById("manage-politicians").style.display = "inline-block"
    }
    update('ppView', "Political Power: " + format(gameData.politicalPower.amount, "number") + " (" + format(getPPIncome() * 60, "number") + "/min)")
}

function getRawIncome() {  // returns income per second BEFORE political power
    var r = 0
    for (gen in generators) {
        let special_factor = 1
        if (gen == "intern" && gameData.specialProjects.sp003) {
            special_factor += (gameData[gen].qty / 100)   
        }
        r += gameData[gen].qty * special_factor * generators[gen].calcIncome(gameData[gen].qty, gameData[gen].upgradeLevel)
    }
    return r
}

function getIncome() {  // returns income per second
    var r = getRawIncome()
    // subtract money invested in political power
    r *= (1 - gameData.politicalPower.slider/100)
    return r
}

function getIncomeSuppText() {
    if (gameData.politicalPower.slider > 0) {
        return "(" + gameData.politicalPower.slider + "% to PP)"
    } else {
        return ""
    }
}

function updateIncome() {
    update("currentIncome", "Printing: $" + format(getIncome() * 60, "money") + "/min " + getIncomeSuppText())
    // Fun fact: In late march of 2020 the fed created about 1 million dollars every second.
}

// Hand Printing
function updatePerClickUpgrade() {
    update("perClickUpgrade", "Upgrade (Cost: $" + format(gameData.moneyPerClickUpgradeCost, "money") + ")")
    updateIncome()
}

function updatehandPrintButton() {
    update("handPrintButton", "Hand-Print $" + format(gameData.moneyPerClick, 'money'))
    updateIncome()
}


// Updates content of element with ID qty{object} 
function updateAssetInfo(object) {
    updateIncome()
    // more generalizable pls
    let capitalized = object.charAt(0).toUpperCase() + object.slice(1)
    let qty = gameData[object].qty
    let lvl = gameData[object].upgradeLevel
    if (qty > 0) {
        var inc = (generators[object].calcIncome(qty, lvl) / qty)  // per unit per second
    } else {
        var inc = 0
    }
    let cost = generators[object].getCost(qty)
    let upgradeCost = generators[object].getUpgradeCost(lvl)
    let upgradePPCost = generators[object].getUpgradePPCost(lvl)
    let qtyMessage = capitalized + "s: " + qty
    let lvlMessage = " (Level " + lvl + ")"
    let incMessage = " - $" + format(inc * 60, 'money') + "/min each"
    if (qty > 0) {
        update(object + 'Qty', qtyMessage + lvlMessage + incMessage)
    } else {
        update(object + 'Qty', qtyMessage)
    }
    update('buy' + capitalized + 'Button', 'Buy ' + capitalized + ' ' + get_cost_string(cost))
    update(object + 'Upgrade', "Upgrade " + get_cost_string(upgradeCost, upgradePPCost))
}

function get_cost_string(money, politicalPower = 0) {
    cost_string = "(Cost: "
    if (money > 0) {
        cost_string += "$" + format(money, 'money')
    }
    if (politicalPower > 0) {
        cost_string += format(politicalPower, 'number') + " PP"
    }
    return cost_string + ")"
}

function updateMenuButtons() {
    document.getElementById("politicalEffortsMenuButton").style.display = "none"
    if (gameData.specialProjects.sp002) {
        document.getElementById("politicalEffortsMenuButton").style.display = "inline-block"
    }
}


///
// Other Helpers
///

function format(number, type) {
    let exponent = Math.floor(Math.log10(number))
    let mantissa = number / Math.pow(10, exponent)
    if (type == "money") {
        if (exponent < 3) return (number).toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
        if (exponent < 6) return (number).toFixed(0).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
        if (exponent == 6) return (number/1e6).toFixed(2) + " Million";
        if (exponent < 9) return (number/1e6).toFixed(1) + " Million";
        if (exponent == 9) return (number/1e9).toFixed(2) + " Billion";
        if (exponent < 12) return (number/1e9).toFixed(1) + " Billion";
        return (number/1e12).toFixed(1) + " Trillion";
        // return Math.round(number).toFixed(0).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
    } else if (type == "number") {
        // return Math.round(number*100)/100
        if (exponent < 3) return (number).toFixed(2).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
        if (exponent < 6) return (number).toFixed(0).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
        if (exponent == 6) return (number/1000000).toFixed(2) + "M";
        if (exponent < 9) return (number/1000000).toFixed(1) + "M";
        if (exponent == 9) return (number/1000000000).toFixed(2) + "B";
        if (exponent < 12) return (number/1000000000).toFixed(1) + "B";
        if (exponent == 12) return (number/1000000000).toFixed(2) + "T";
        if (exponent < 15) return (number/1000000000).toFixed(1) + "T";
        return Math.round(mantissa*100)/100 + "e" + exponent  // 8.9e10
        //return (Math.round(Math.pow(10, exponent % 3) * mantissa)*100)/100 + "e" + (Math.floor(exponent / 3) * 3)  // 89e9
    }
}

function tab(tab) {
    // hide all your tabs, then show the one the user selected.
    document.getElementById("productionMenu").style.display = "none"
    document.getElementById("specialProjectsMenu").style.display = "none"
    document.getElementById("politicalEffortsMenu").style.display = "none"
    document.getElementById(tab).style.display = "inline-block"
    if (tab == 'specialProjectsMenu') { viewSpecialProjects() }
}
// go to a tab for the first time, so not all show
tab("productionMenu")

function log(obj) {
    // Get the value of obj at the moment you log it
    // if you just console.log(obj) it'll store a reference that
    // updates as values change - which may be what you want sometimes
    console.log(JSON.parse(JSON.stringify(obj)))
}

function viewSpecialProjects() {
    document.getElementById("specProj001").style.display = "none"
    document.getElementById("specProj002").style.display = "none"
    document.getElementById("specProj003").style.display = "none"
    document.getElementById("specProj001Finished").style.display = "none"
    document.getElementById("specProj002Finished").style.display = "none"
    document.getElementById("specProj003Finished").style.display = "none"
    // TODO: "no projects yet" thing
    // also maybe update spec proj button when there's one available
    if (gameData.totalPrinted > 200 && !gameData.specialProjects.sp001) {
        document.getElementById("specProj001").style.display = "inline-block"
    } else if (gameData.specialProjects.sp001) {
        document.getElementById("specProj001Finished").style.display = "inline-block"
    }
    if (gameData.totalPrinted > 2000 && !gameData.specialProjects.sp002) {
        document.getElementById("specProj002").style.display = "inline-block"
    } else if (gameData.specialProjects.sp002) {
        document.getElementById("specProj002Finished").style.display = "inline-block"
    }
    if (gameData.totalPrinted > 10000 && !gameData.specialProjects.sp003) {
        document.getElementById("specProj003").style.display = "inline-block"
    } else if (gameData.specialProjects.sp003) {
        document.getElementById("specProj003Finished").style.display = "inline-block"
    }
}

function specialProject001() {
    if (gameData.money > 2000) {
        gameData.money -= 2000
        gameData.specialProjects.sp001 = true
        enableSpeicalProject("sp001")
        viewSpecialProjects()
        updateMoney()
        updateAssetInfo('intern')
    }
}

function specialProject002() {
    if (gameData.money > 15000) {
        gameData.money -= 15000
        gameData.specialProjects.sp002 = true
        enableSpeicalProject("sp002")
        viewSpecialProjects()
        updateMoney()
        updatePP()
        updateMenuButtons()
    }
}

function specialProject003() {
    if (gameData.money > 25000) {
        gameData.money -= 25000
        gameData.specialProjects.sp003 = true
        enableSpeicalProject("sp003")
        viewSpecialProjects()
        updateMoney()
        updateAssetInfo('intern')
    }
}


function enableSpeicalProject(proj) {
    switch(proj) {
        case "sp001":
            generators.intern.baseCost = 2.25
            generators.intern.baseUpgradeCost = 50
            break
        case "sp002":
            break
        case "sp003":
            generators.intern.scaleFactor = 0.01
            break
        default: 
            log("Unexpected special project key: " + proj)
    }
}


//
// Political Power
//

// Update the current slider value (each time you drag the slider handle)
ppSlider.oninput = function() {
    gameData.politicalPower.slider = this.value
    updateIncome()
}

function getPPIncome() {  // returns PP gained per second
    var r = getRawIncome()
    r *= (gameData.politicalPower.slider / 100)
    r /= gameData.politicalPower.cost
    return r
}

//
// Assets
//

// Hand Printer

function brr(r = 1) {
    gameData.money += gameData.moneyPerClick * r
    gameData.totalPrinted += gameData.moneyPerClick * r
    updateMoney()
}

function pppls(r = 1) {
    gameData.politicalPower.amount += r
    updatePP()
}

function buyMoneyPerClickUpgrade() {
    if (gameData.money >= gameData.moneyPerClickUpgradeCost) {
        gameData.money -= gameData.moneyPerClickUpgradeCost
        gameData.moneyPerClick += 1
        gameData.moneyPerClickUpgradeCost = 5 + (gameData.moneyPerClickUpgradeCost * 1.07)
        updateMoney()
        updatePerClickUpgrade()
        updatehandPrintButton()
    }
}

// let's make more generalized functions please
function buyGenerator(gen) {
    // usage: buyGenerator("intern") to attempt to buy an intern
    genCost = generators[gen].getCost(gameData[gen].qty)
    if (gameData.money >= genCost) {
        gameData.money -= genCost
        gameData[gen].qty += 1
        updateAssetInfo(gen)
        updateMoney()
    }
}

function buyGeneratorUpgrade(gen) {
    upgradeCost = generators[gen].getUpgradeCost(gameData[gen].upgradeLevel)
    if (gameData.money >= upgradeCost) {
        gameData.money -= upgradeCost
        gameData[gen].upgradeLevel += 1
        updateAssetInfo(gen)
        updateMoney()
    }
}

//
// Saving and Loading
//

// Load local storage to gameData
function load_game() {
    // Load local storage to gameData
    var savegame = JSON.parse(localStorage.getItem("moneyPrinterSave"));
    if (savegame !== null) { // if a save exists
        gameData = {};
        // Populate gameData
        for (key in initialGameData) {
            // use default values
            if (initialGameData.hasOwnProperty(key)) {
                gameData[key] = initialGameData[key];
            }
            // instead use the savegame value if one exists
            if (savegame.hasOwnProperty(key)) {
                gameData[key] = savegame[key];
            }
        }
        // ignore properties in savegame that doen't exist in initialGameData
        ppSlider.value = gameData.politicalPower.slider; // visually update slider

        for (specialProject in gameData.specialProjects) {
            if (gameData.specialProjects[specialProject]) {
                // bug: these are not disabled on reset()
                enableSpeicalProject(specialProject);
            }
        }
    }
    updateEverything();
}

load_game();


// Save gameData to local storage
var saveGameLoop = window.setInterval(function() {
    saveGame()
}, 1000)  // every 1 second

function saveGame() {
    localStorage.setItem("moneyPrinterSave", JSON.stringify(gameData))
}


//
// Main Game Loop
//

var mainGameLoop = window.setInterval(function() {
    diff = Date.now() - gameData.lastTick; // ms since last tick
    seconds = diff/1000
    gameData.lastTick = Date.now() // Don't forget to update lastTick.
    gameData.money += getIncome() * seconds
    gameData.totalPrinted += getIncome() * seconds
    gameData.politicalPower.amount += getPPIncome() * seconds
    viewSpecialProjects()
    updateMoney()
    updatePP()
}, 100)

