// export default function for nextjs route

import { NextApiRequest, NextApiResponse } from "next";

// this function will cors proxy to the url
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url) {
	res.status(400).json({ error: 'url is required' });
	return;
  }
  const data = await fetch(url as string).then(res => res.json());
  res.status(200).json(data);
}
