/**
 * Benchmark file for pi-smart-reader
 * Contains many functions to test AST extraction and token reduction.
 */

export class UserAuthService {
	public async login(username: string, password: string): Promise<boolean> {
		console.log("Logging in user...");
		const user = await this.findUser(username);
		if (!user) return false;
		const isValid = await this.verifyPassword(password, user.hash);
		if (isValid) {
			const token = this.generateToken(user.id);
			await this.logSession(user.id, token);
			return true;
		}
		return false;
	}

	private async findUser(username: string): Promise<any> {
		// Simulate DB lookup
		return { id: "123", hash: "hashed_password" };
	}

	private async verifyPassword(
		password: string,
		hash: string,
	): Promise<boolean> {
		// Simulate password check
		return password === "password123";
	}

	private generateToken(userId: string): string {
		return "jwt_token_" + userId + "_" + Date.now();
	}

	private async logSession(userId: string, token: string): Promise<void> {
		console.log(`Session started for ${userId}`);
	}
}

export class DataProcessor {
	public processData(data: any[]): any[] {
		console.log("Starting data processing...");
		const filtered = this.filterInvalid(data);
		const mapped = this.mapToInternal(filtered);
		const sorted = this.sortData(mapped);
		return this.finalize(sorted);
	}

	private filterInvalid(data: any[]): any[] {
		return data.filter((item) => item !== null && item !== undefined);
	}

	private mapToInternal(data: any[]): any[] {
		return data.map((item) => ({ ...item, processed: true }));
	}

	private sortData(data: any[]): any[] {
		return data.sort((a, b) => a.id - b.id);
	}

	private finalize(data: any[]): any[] {
		console.log("Finalizing process...");
		return data;
	}
}

function helperUtility1() {
	console.log("Util 1");
	return true;
}

function helperUtility2() {
	console.log("Util 2");
	return false;
}

// Adding more filler functions to increase file size
function filler1() {
	return 1;
}
function filler2() {
	return 2;
}
function filler3() {
	return 3;
}
function filler4() {
	return 4;
}
function filler5() {
	return 5;
}
function filler6() {
	return 6;
}
function filler7() {
	return 7;
}
function filler8() {
	return 8;
}
function filler9() {
	return 9;
}
function filler10() {
	return 10;
}
function filler11() {
	return 11;
}
function filler12() {
	return 12;
}
function filler13() {
	return 13;
}
function filler14() {
	return 14;
}
function filler15() {
	return 15;
}
function filler16() {
	return 16;
}
function filler17() {
	return 17;
}
function filler18() {
	return 18;
}
function filler19() {
	return 19;
}
function filler20() {
	return 20;
}
