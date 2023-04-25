
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

function Timeline(props) {
	const [post, setPost] = useState('');
	const [feedData, setFeedData] = useLocalStorage('feedData', null);

	// useEffect to log feedData on change
	useEffect(() => {
		console.log("some feed data", feedData);
	}, [feedData]);

	const handleTimeline = async (e) => {
		e.preventDefault();
		try {
			const sessionData = props.sessionData.data;
			console.log('Session data:', sessionData);
			if (!sessionData) {
				console.error('No session data found. Please log in first.');
				return;
			}
			await props.agent.resumeSession(sessionData);

			const res = await props.agent.getTimeline();
			console.log('Timeline here. Response:', res);
			setFeedData(res.data.feed);
		} catch (error) {
			console.error('Post creation error:', error);
		}
	};

	return (
		<form
			style={{ zIndex: 1000, position: "relative" }}
			onSubmit={handleTimeline}
		>
			<button type="submit">Update Feed Data</button>
		</form>
	);
}
export default Timeline;