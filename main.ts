import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

// Remember to rename these classes and interfaces!

interface SimpleDiceRollerPluginSettings {
	showAverageRibbonIcon: boolean,
	showSimulateRibbonIcon: boolean,
}

const DEFAULT_SETTINGS: SimpleDiceRollerPluginSettings = {
	showAverageRibbonIcon: true,
	showSimulateRibbonIcon: false,
}

export default class SimpleDiceRoller extends Plugin {
	settings: SimpleDiceRollerPluginSettings;
	averageRibbonIconEl: HTMLElement | undefined = undefined;
	simulateRibbonIconEl: HTMLElement | undefined = undefined;

	getAllFormulas(): string[] {
		let captureAllFormulas = /\d?d\d+.*?(?= |\n|$)/gi;
		const markdownView = this.app.workspace?.getActiveViewOfType(MarkdownView);
		let allFormulas = markdownView?.getViewData().match(captureAllFormulas);
		if (allFormulas == null) {
			new Notice("No dice found on screen");
			return null;
		}
		console.log("================================================================");
		console.log("Simple Dice Roller");
		console.log("================================================================");
		console.log(`Calculating for ${allFormulas.length} formulas`);
		return allFormulas;
	}

	simulateAllDiceOnScreen() {
		let allFormulas = this.getAllFormulas();
		if (allFormulas == null) {
			return;
		}
		for (let i = 0; i < allFormulas.length; i++) {
			let formula = allFormulas[i];
			let result = this.simulateDiceFormula(formula);
			new Notice(`Simulated ${formula}: ${result}`);
		}
		console.log("================================================================");
	}

	averageAllDiceOnScreen() {
		let allFormulas = this.getAllFormulas();
		if (allFormulas == null) {
			return;
		}
		for (let i = 0; i < allFormulas.length; i++) {
			console.log(`Calculating ${allFormulas[i]}`);
			new Notice(`Average of ${allFormulas[i]}: ${this.calculateFormula(allFormulas[i])}`);
		}
		console.log("================================================================");
	}

	calculateFormula(formula: string) {
		let splitAllDice = /\d?d\d+/gi;
		let constAdditions = /(?<=\+)(\d+)(?=\+|$)/gi;
		let diceAmount = /\d+/gi;
		let diceSize = /(?<=d).*/gi;
		let sum = 0;
		let dice = formula.match(splitAllDice);
		console.log(`Found ${dice.length} dice`);
		for (let i = 0; i < dice.length; i++) {
			if (dice[i].charAt(0) == "d" || dice[i].charAt(0) == "D") {
				dice[i] = "1" + dice[i];
			}
			let amountOfDice = parseInt(dice[i].match(diceAmount)[0], 10);
			let sizeOfDice = parseInt(dice[i].match(diceSize)[0], 10);
			sum += Math.ceil(this.averageDice(amountOfDice, sizeOfDice));
		}
		let additions = formula.match(constAdditions);
		if (additions) {
			console.log(`Found ${additions.length} additions`);
			for (let i = 0; i < additions.length; i++) {
				sum += parseInt(additions[i], 10);
			}
		}
		return sum;
	}

	averageDice(numberOfDice: number, sizeOfDice: number): number {
		return numberOfDice * this.averageDie(sizeOfDice);
	}

	averageDie(number: number): number {
		return (number + 1) / 2;
	}

	getRandomInt(min: number, max: number): number {
		// Create byte array and fill with 1 random number
		var byteArray = new Uint8Array(1);
		window.crypto.getRandomValues(byteArray);

		var range = max - min + 1;
		var max_range = 256;
		if (byteArray[0] >= Math.floor(max_range / range) * range)
			return this.getRandomInt(min, max);
		return min + (byteArray[0] % range);
	}

	simulateDice(numberOfDice: number, sizeOfDice: number): number {
		let sum = 0;
		for (let i = 0; i < numberOfDice; i++) {
			sum += this.getRandomInt(1, sizeOfDice);
		}
		return sum;
	}

	simulateDiceFormula(formula: string) {
		let splitAllDice = /\d+d\d+/gi;
		let constAdditions = /(?<=\+)(\d+)(?=\+|$)/gi;
		let diceAmount = /\d+/gi;
		let diceSize = /(?<=d).*/gi;
		let sum = 0;
		let dice = formula.match(splitAllDice);
		console.log(`Found ${dice.length} dice`);
		for (let i = 0; i < dice.length; i++) {
			let amountOfDice = parseInt(dice[i].match(diceAmount)[0], 10);
			let sizeOfDice = parseInt(dice[i].match(diceSize)[0], 10);
			sum += this.simulateDice(amountOfDice, sizeOfDice);
		}
		let additions = formula.match(constAdditions);
		if (additions) {
			console.log(`Found ${additions.length} additions`);
			for (let i = 0; i < additions.length; i++) {
				sum += parseInt(additions[i], 10);
			}
		}
		return sum;
	}

	refreshRibbon() {
		this.averageRibbonIconEl?.remove();
		this.simulateRibbonIconEl?.remove();


		if (this.settings.showAverageRibbonIcon) {
			this.averageRibbonIconEl = this.addRibbonIcon("dice", "Average all dice", (evt: MouseEvent) => {
				// Called when the user clicks the icon.
				this.averageAllDiceOnScreen();
			});
		}

		if (this.settings.showSimulateRibbonIcon) {
			this.simulateRibbonIconEl = this.addRibbonIcon("dice", "Simulate all dice", (evt: MouseEvent) => {
				// Called when the user clicks the icon.
				this.simulateAllDiceOnScreen();
			});
		}
	}

	async onload() {
		this.addSettingTab(new SimpleDiceRollerTab(this.app, this));
		await this.loadSettings();

		this.addCommand({
			id: "average-all-dice",
			name: "Calculate averages for all dice on page",
			callback: () => {
				this.averageAllDiceOnScreen();
			}
		});

		this.addCommand({
			id: "simulate-all-dice",
			name: "Simulates all dice formulas on page",
			callback: () => {
				this.simulateAllDiceOnScreen();
			}
		});


		this.refreshRibbon();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SimpleDiceRollerTab extends PluginSettingTab {
	plugin: SimpleDiceRoller;

	constructor(app: App, plugin: SimpleDiceRoller) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Simple Dice Roller Settings" });

		new Setting(containerEl)
			.setName("Average Dice Roll on Ribbon Bar")
			.setDesc("Show button on ribbon bar that will average all dice on page.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showAverageRibbonIcon).onChange(async (value) => {
					this.plugin.settings.showAverageRibbonIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbon();
				});
			});

		new Setting(containerEl)
			.setName("Simulate Dice Roll on Ribbon Bar")
			.setDesc("Show button on ribbon bar that will simulate all dice on page.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showSimulateRibbonIcon).onChange(async (value) => {
					this.plugin.settings.showSimulateRibbonIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbon();
				});
			});
	}
}
