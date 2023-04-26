// pages/api/image-proxy.js
async function fetchImage(targetUrl) {
	const response = await fetch(targetUrl);
	const buffer = await response.arrayBuffer();
	const base64Image = Buffer.from(buffer).toString('base64');
	const contentType = response.headers.get('content-type');
	return { base64Image, contentType };
  }
  
  export default async function handler(req, res) {
	const targetUrl = req.body.url;
  
	try {
	  const { base64Image, contentType } = await fetchImage(targetUrl);
	  res.status(200).json({ base64Image: `data:${contentType};base64,${base64Image}` });
	} catch (error) {
	  console.error('Error fetching image:', error);
	  res.status(500).json({ message: 'Error fetching image' });
	}
  }
  