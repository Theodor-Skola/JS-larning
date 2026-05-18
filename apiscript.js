
async function räknaAlgebra() {
	let currency = document.getElementById("currency").value;
	let amount = document.getElementById("amount").value;
	let currencyto = document.getElementById("currencyto").value;
	
	if (currency == "" || amount == "" || currencyto == "") {
		console.log("Ingen input");
	} else {
		
		const apiToken = "582c73549ee5751cebb3ef329ab44106";
		
		let requestUrl = "http://api.currencylayer.com/convert?access_key={apiToken}&from={currency}&to={currencyto}&amount={amount}&format=1"
		
		const response = await fetch(requestUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
		});
		

		if (response.IsSuccessStatusCode)
		{
			let responseBody = await response.Content.ReadAsStringAsync();

			// Parsa JSON-svaret för att hämta själva affiliatelänken
			let doc = JsonDocument.Parse(responseBody);
			let trackingUrl = doc.RootElement.GetProperty("trackingUrl").GetString();

			document.getElementById("output").innerText = trackingUrl;
		}
		else
		{
			// Tips: Om du får statuskod 429 betyder det att du slagit i taket för Rate Limiting (30 anrop/min)
			console.log("Fel vid konvertering av " + originelLänk + ". Statuskod: " + response.StatusCode);
		}

		// Pausa lite mellan anropen för att inte slå i API:ets rate limit (30 per minut)
	}
}