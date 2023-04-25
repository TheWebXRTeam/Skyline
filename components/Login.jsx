import React, { useEffect, useState } from 'react';
import { BskyAgent, AtpSessionEvent, AtpSessionData } from '@atproto/api';
// import dynamic from next
import dynamic from 'next/dynamic';
// instead of the direct import, dynamically import Timeline in Next.js
const Timeline = dynamic(() => import('./Timeline'), { ssr: false })

import { useLocalStorage } from './useLocalStorage';

function LoginForm() {

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');


	const [sessionData, setSessionData] = useLocalStorage('sessionData', null);
	const [feedData, setFeedData] = useLocalStorage('feedData', null);

	const agent = new BskyAgent({
		service: 'https://bsky.social/',
		persistSession: (evt, sess) => {
			setSessionData(sess);
		},
	});

	useEffect(() => {
		console.log("some feed data", feedData);
	}, [feedData]);
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			console.log('Attempting login with username:', username);
			const sessionData = await agent.login({ identifier: username, password });
			console.log('Login successful. Session data:', sessionData);
			setSessionData(sessionData); // Save the session data to local storage
		} catch (error) {
			console.error('Login error:', error);
		}
	};

	return (
		<>
			<form
				onSubmit={handleSubmit}
				style={{
					position: "relative",
					top: 0,
					zIndex: 100,
				}}
			>
				<label>
					Username:
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
				</label>
				<label>
					Password:
					<input
						style={{ maxWidth: '50px' }}
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</label>
				<button type="submit">Login</button>
			</form>
			<Timeline
				agent={agent}
				sessionData={sessionData}
			/>
		</>
	);
}

export default LoginForm;
