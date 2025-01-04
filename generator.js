class Generator {
    constructor({baseCost=10, baseOutput=1, qtyCostAdd=0, qtyCostMulti=1, baseUpgradeCost=0, upgradeCostAdd=0, upgradeCostMulti=1, baseUpgradePPCost=0, upgradePPCostAdd=0, upgradePPCostMulti=1, upgradeOutputMulti=1, scaleFactor=0} = {}) {
        // baseCost - initial cost value for purchase
        // baseOutput - initial output value per second
        this.baseCost = baseCost;
        this.baseOutput = baseOutput;
        // Quantity cost addition (added to cost of "factory" when another one is purchased)
        // Quantity cost multiplier (multiplied to cost of "factory" when one is purchased)
        this.qtyCostAdd = qtyCostAdd;
        this.qtyCostMulti = qtyCostMulti;
        // baseUpgradeCost - initial cost value for upgrade
        // Upgrade cost addition (added to cost of upgrade when one is purchased)
        // Upgrade cost multiplier (multiplied to cost of upgrade when one is purchased)
        this.baseUpgradeCost = baseUpgradeCost;
        this.upgradeCostAdd = upgradeCostAdd;
        this.upgradeCostMulti = upgradeCostMulti;
        //
        //
        //
        this.baseUpgradePPCost = baseUpgradePPCost
        this.upgradePPCostAdd = upgradePPCostAdd
        this.upgradePPCostMulti = upgradePPCostMulti
        // Upgrade output multiplier (multiplied to output of product when upgrade is purchased)
        this.upgradeOutputMulti = upgradeOutputMulti;
        // Scale factor (multiplied to output of product AND quantity of generators)
        // e.g. scale factor of 0.01 means that each 1 qty adds 1% effeciency to all generators of that type
        this.scaleFactor = scaleFactor
    }
    getCost(qty) {
        return ((this.baseCost * (this.qtyCostMulti ** qty)) + (this.qtyCostAdd * qty));
    }
    getUpgradeCost(upgradeLevel) {
        return (this.baseUpgradeCost * Math.pow(this.upgradeCostMulti, upgradeLevel)) + (this.upgradeCostAdd * upgradeLevel)
    }
    getUpgradePPCost(upgradeLevel) {
        return this.baseUpgradePPCost * Math.pow(this.upgradePPCostMulti, upgradeLevel) + (this.upgradePPCostAdd * upgradeLevel)
    }
    calcIncome(qty, upgradeLevel) {
        return (qty * (1 + (qty * this.scaleFactor)) * this.baseOutput * Math.pow(this.upgradeOutputMulti, upgradeLevel));
    }
}
