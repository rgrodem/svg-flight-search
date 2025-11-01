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
        const { timeFrom = '0', timeTo = '168', airport = 'SVG' } = req.query;

        // Bygg Avinor API URL
        const avinorUrl = `https://asrv.avinor.no/XmlFeed/v1.0?TimeFrom=${timeFrom}&TimeTo=${timeTo}&airport=${airport}`;

        console.log('Henter fra Avinor API:', avinorUrl);

        // Hent data fra Avinor API med riktige headers
        const response = await fetch(avinorUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/xml, text/xml, */*',
            }
        });

        if (!response.ok) {
            throw new Error(`Avinor API feilet med status ${response.status}`);
        }

        // Hent XML-data
        const xmlData = await response.text();

        // Sjekk om vi faktisk fikk XML og ikke HTML
        if (xmlData.includes('<!DOCTYPE html>')) {
            console.error('Fikk HTML i stedet for XML. Første 500 tegn:', xmlData.substring(0, 500));
            throw new Error('Avinor API returnerte HTML i stedet for XML');
        }

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
