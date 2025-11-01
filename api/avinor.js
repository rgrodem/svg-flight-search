// Vercel serverless function for å hente data fra Avinor API
// Dette løser CORS-problemet ved å hente data fra serveren

export default async function handler(req, res) {
    // Tillat CORS fra alle domener
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Håndter OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Kun tillat GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Hent parametere fra query string
        const { timeFrom = '0', timeTo = '48', airport = 'SVG' } = req.query;

        // Bygg Avinor API URL
        const avinorUrl = `https://flydata.avinor.no/XmlFeed.asp?TimeFrom=${timeFrom}&TimeTo=${timeTo}&airport=${airport}`;

        console.log('Henter fra Avinor API:', avinorUrl);

        // Hent data fra Avinor API
        const response = await fetch(avinorUrl);

        if (!response.ok) {
            throw new Error(`Avinor API feilet med status ${response.status}`);
        }

        // Hent XML-data
        const xmlData = await response.text();

        console.log('XML hentet, lengde:', xmlData.length);

        // Returner XML med riktig content-type
        res.setHeader('Content-Type', 'application/xml');
        res.status(200).send(xmlData);

    } catch (error) {
        console.error('Feil ved henting fra Avinor API:', error);
        res.status(500).json({
            error: 'Kunne ikke hente data fra Avinor API',
            message: error.message
        });
    }
}
