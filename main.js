var initialGameData = {
    money: 0,
    totalPrinted: 0,
    moneyPerClick: 1,
    moneyPerClickUpgradeCost: 10,
    lastTick: Date.now(),
    ideal: {
        qty: 0,
        upgradeLevel: 0,
        baseCost: 100,
        baseOuput: 10,
        baseUpgradeCost: 200
    },
    intern: {
        qty: 0,
        upgradeLevel: 0,
    },
    printer: {
        qty: 0,
        cost: 80,
        output: 5,
        upgradeLevel: 0,
        upgradeCost: 2000
    },
    politician: {
        qty: 0,
        cost: 2000,
        output: 16,
        upgradeLevel: 0,
        upgradePPCost: 10
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
    intern: new Generator(
        baseCost = 7.25,
        baseOutput = 0.5,
        qtyCostAdd = 1.75,
        qtyCostMulti = 1.4,
        baseUpgradeCost = 100,
        upgradeCostAdd = 10,
        upgradeCostMulti = 1.015,
        // baseUpgradePPCost = 0,
        // upgradePPCostAdd = 0,
        // upgradePPCostMulti = 1,
        upgradeOutputMulti = 1.6
    ),
    printer: new Generator(
        baseCost = 80,
        baseOutput = 5,
        // qtyCostAdd = 0,
        qtyCostMulti = 1.4,
        baseUpgradeCost = 2000,
        upgradeCostAdd = 0,
        upgradeCostMulti = 1.6,
        baseUpgradePPCost = 0,
        upgradePPCostAdd = 0,
        upgradePPCostMulti = 1,
        upgradeOutputMulti = 1.1355
    ),
    politician: new Generator(
        baseCost = 2000,
        baseOutput = 16,
        // qtyCostAdd = 0,
        qtyCostMulti = 17.76,
        // baseUpgradeCost = 0,
        // upgradeCostAdd = 0,
        // upgradeCostMulti = 1,
        baseUpgradePPCost = 10,
        // upgradePPCostAdd = 0,
        upgradePPCostMulti = 1.2,
        upgradeOutputMulti = 1.068
    ),
}


// var gameNumbers = {
//     'intern': {
//         baseCost: 7.25,
//         baseOuput: 0.5,
//         baseUpgradeCost: 100,
//         // upgradeCostAdd: 10,
//         // upgradeCostMulti: 1.015,
//     },
//     'printer': {
//         baseCost: 80,
//         baseOuput: 5,
//         baseUpgradeCost: 2000
//     },
//     'politician': {
//         baseCost: 2000,
//         baseOuput: 16,
//         baseUpgradePPCost: 10
//     }
// }

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

function operationCwal() {
    gameData.intern.cost = 0
    gameData.printer.cost = 0
    updateEverything()
}

function somethingForNothing() {
    gameData.moneyPerClickUpgradeCost = 0
    gameData.intern.upgradeCost = 0
    gameData.printer.upgradeCost = 0
    gameData.politician.upgradePPCost = 0
    updateEverything()
}

function bankruptcy() {
    gameData.money = 0
    updateMoney()
}

function prestige() {
    // lose all money and assets, costs reset, but you keep upgrades
    gameData.money = 0
    gameData.intern.qty = 0
    gameData.printer.qty = 0
    gameData.politician.qty = 0

    gameData.intern.cost = initialGameData.intern.cost
    gameData.printer.cost = initialGameData.printer.cost
    gameData.politician.cost = initialGameData.politician.cost

    gameData.intern.upgradeCost = initialGameData.intern.upgradeCost
    gameData.printer.upgradeCost = initialGameData.printer.upgradeCost
    gameData.politician.upgradePPCost = initialGameData.politician.upgradePPCost

    for (key in gameData.specialProjects) {
        gameData.specialProjects[key] = false
    }

    updateEverything()
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

// function getOutput(prod) {  // returns output per second of some product like 'printer'
//     gameNumbers[prod].baseOutput
// }

function getRawIncome() {  // returns income per second BEFORE political power
    var r = 0
    for (gen in generators) {
        r += generators[gen].calcIncome(gameData[gen].qty, gameData[gen].upgradeLevel)
    }
    return r
    // r += (gameData.intern.qty * gameData.intern.output)
    // r += (gameData.printer.qty * gameData.printer.output)
    // r += (gameData.politician.qty * gameData.politician.output)
    // return r
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
    let qtyMessage = capitalized + "s: " + qty
    let lvlMessage = " (Level " + lvl + ")"
    let incMessage = " - $" + format(inc * 60, 'money') + "/min each"
    update(object + 'Qty', qtyMessage + lvlMessage + incMessage)
    update('buy' + capitalized + 'Button', 'Buy ' + capitalized + ' (Cost: $' + format(cost, 'money') + ')')
    update(object + 'Upgrade', "Upgrade (Cost: $" + format(upgradeCost, 'money') + ")")
    //
    // if (object == 'intern') {
    //     let qty = "Interns: " + gameData.intern.qty
    //     let lvl = " (Level " + gameData.intern.upgradeLevel + ")"
    //     let inc = " - $" + format(gameData.intern.output * 60, 'money') + "/min each"
    //     update('internQty', qty + lvl + inc)
    //     update("buyInternButton", "Hire Intern (Cost: $" + format(generators.intern.getCost(gameData.intern.qty), 'money') + ")")
    //     update('internUpgrade', "Upgrade (Cost: $" + format(intern.getUpgradeCost(gameData.intern.upgradeLevel), 'money') + ")")
    // } else if (object == 'printer') {
    //     let qty = "Printers: " + gameData.printer.qty
    //     let lvl = " (Level " + gameData.printer.upgradeLevel + ")"
    //     let inc = " - $" + format(gameData.printer.output * 60, 'money') + "/min each"
    //     update('printerQty', qty + lvl + inc)
    //     update("buyPrinterButton", "Buy Printer (Cost: $" + format(gameData.printer.cost, 'money') + ")")
    //     update('printerUpgrade', "Upgrade (Cost: $" + format(gameData.printer.upgradeCost, 'money') + ")")
    // } else if (object == 'politician') {
    //     let qty = "Politicians: " + gameData.politician.qty
    //     let lvl = " (Level " + gameData.politician.upgradeLevel + ")"
    //     let inc = " - $" + format(gameData.politician.output * 60, 'money') + "/min each"
    //     update('politicianQty', qty + lvl + inc)
    //     update("buyPoliticianButton", "Buy Politician (Cost: $" + format(gameData.politician.cost, 'money') + ")")
    //     update('politicianUpgrade', "Upgrade (Cost: " + format(gameData.politician.upgradePPCost, 'number') + " PP)")
    // }
    
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
    document.getElementById("specProj001Finished").style.display = "none"
    document.getElementById("specProj002Finished").style.display = "none"
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
}

function specialProject001() {
    if (gameData.money > 2000) {
        gameData.money -= 2000
        gameData.specialProjects.sp001 = true
        gameData.intern.cost *= 0.2
        gameData.intern.upgradeCost *= 0.5
        viewSpecialProjects()
        updateMoney()
        updateAssetInfo('intern')
    }
}

function specialProject002() {
    if (gameData.money > 15000) {
        gameData.money -= 15000
        gameData.specialProjects.sp002 = true
        viewSpecialProjects()
        updateMoney()
        updatePP()
        updateMenuButtons()
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

// Interns

// function buyInterns() {
//     internCost = intern.getCost(gameData.intern.qty)
//     if (gameData.money >= internCost) {
//         gameData.money -= internCost
//         gameData.intern.qty += 1
//         updateAssetInfo('intern')
//         updateMoney()
//     }
// }

// function buyInternUpgrade() {
//     upgradeCost = intern.getCost(gameData.intern.qty)
//     if (gameData.money >= upgradeCost) {
//         gameData.money -= upgradeCost
//         gameData.intern.upgradeLevel += 1
//         updateAssetInfo('intern')
//         updateMoney()
//     }
// }

// function getCostOfMany() {}

// Printers

function buyPrinters() {
    if (gameData.money >= gameData.printer.cost) {
        gameData.money -= gameData.printer.cost
        gameData.printer.qty += 1
        gameData.printer.cost *= 1.4
        updateAssetInfo('printer')
        updateMoney()
    }
}

function buyPrinterUpgrade() {
    if (gameData.money >= gameData.printer.upgradeCost) {
        gameData.money -= gameData.printer.upgradeCost
        gameData.printer.upgradeLevel += 1
        // gameData.printer.output = gameData.printer.upgradeLevel + Math.pow(1.12, gameData.printer.output)
        gameData.printer.output *= 1.1355  // inflation in 1980
        gameData.printer.upgradeCost = gameData.printer.upgradeCost * 1.6
        updateAssetInfo('printer')
        updateMoney()
    }
}

// Politicians

function buyPoliticians() {
    if (gameData.money >= gameData.politician.cost) {
        gameData.money -= gameData.politician.cost
        gameData.politician.qty += 1
        gameData.politician.cost *= 17.76
        updateAssetInfo('politician')
        updatePP()
    }
}

function buyPoliticianUpgrade() {
    if (gameData.politicalPower.amount >= gameData.politician.upgradePPCost) {
        gameData.politicalPower.amount -= gameData.politician.upgradePPCost
        gameData.politician.upgradeLevel += 1
        gameData.politician.output *= 1.068  // current rate of inflation
        gameData.politician.upgradePPCost = gameData.politician.upgradePPCost * 1.2
        updateAssetInfo('politician')
        updatePP()
    }
}


//
// Saving and Loading
//

// Load local storage to gameData
var savegame = JSON.parse(localStorage.getItem("moneyPrinterSave"))
if (savegame !== null) {  // if a save exists
    gameData = {}
    // Populate gameData
    for (key in initialGameData) {
        // use default values
        if(initialGameData.hasOwnProperty(key)){
            gameData[key] = initialGameData[key];
        }
        // instead use the savegame value if one exists
        if(savegame.hasOwnProperty(key)){
            gameData[key] = savegame[key];
        }
    }
    // ignore properties in savegame that doen't exist in initialGameData
    ppSlider.value = gameData.politicalPower.slider  // visually update slider
    updateEverything()
}

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

