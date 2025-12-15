// Makes requests to your local server
export async function makeApiRequest(path) {
	try {
		// fetching from the own api
		console.log(`/api/${path}`)
		const response = await fetch(`/api/${path}`);
		// console.log(`http://localhost:5001/${path}`)
		// const response = await fetch(`http://localhost:5001/${path}`);
		return response.json();
	} catch (error) {
		throw new Error(`request error: ${error.status}`);
	}
}

// Generates a symbol ID from a pair of the coins
export function generateSymbol(exchange, fromSymbol, toSymbol) {
	const short = `${fromSymbol}/${toSymbol}`;
	console.log("in the generateSymbol function", exchange, fromSymbol, toSymbol);
	return {
		short,
		full: `${exchange}:${short}`,
	};
}

// Returns all parts of the symbol
export function parseFullSymbol(fullSymbol) {
	const match = fullSymbol.match(/^(\w+):(\w+)\/(.+)$/);
	if (!match) {
		return null;
	}

	return {
		exchange: match[1],
		fromSymbol: match[2],
		toSymbol: match[3],
	};
}
