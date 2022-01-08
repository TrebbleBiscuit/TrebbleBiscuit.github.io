class Generator {
    constructor(baseCost, baseOutput, qtyCostAdd, qtyCostMulti, baseUpgradeCost, upgradeCostAdd, upgradeCostMulti, upgradeOutputMulti) {
        // baseCost - initial cost value for purchase
        // baseOutput - initial output value per second
        // Quantity cost addition (added to cost of "factory" when another one is purchased)
        // Quantity cost multiplier (multiplied to cost of "factory" when one is purchased)
        // baseUpgradeCost - initial cost value for upgrade
        // Upgrade cost addition (added to cost of upgrade when one is purchased)
        // Upgrade cost multiplier (multiplied to cost of upgrade when one is purchased)
        // Upgrade output multiplier (multiplied to output of product when upgrade is purchased)
        this.baseCost = baseCost;
        this.baseOutput = baseOutput;
        this.qtyCostAdd = qtyCostAdd;
        this.qtyCostMulti = qtyCostMulti;
        this.baseUpgradeCost = baseUpgradeCost;
        this.upgradeCostAdd = upgradeCostAdd;
        this.upgradeCostMulti = upgradeCostMulti;
        this.upgradeOutputMulti = upgradeOutputMulti;
        this.qty = 0
        this.upgradeLevel = 0
    }
    // Getter
    get cost(qty) {
        return ((this.baseCost * (this.qtyCostMulti ** this.qty)) + (this.qtyCostAdd * this.qty));
    }
    get costUpgrade(level) {
        return (this.baseUpgradeCost * Math.pow(this.upgradeCostMulti, this.upgradeLevel)) + (this.upgradeCostAdd * this.upgradeLevel)
    }
    // Method
    calcIncome() {
        return (this.qty * (this.baseOutput * Math.pow(this.upgradeOutputMulti, this.upgradeLevel)));
    }
}