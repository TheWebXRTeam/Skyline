import { useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
	const [storedValue, setStoredValue] = useState(() => {
		if (typeof window !== 'undefined') {
			try {
				const item = window.localStorage.getItem(key);
				return item ? JSON.parse(item) : initialValue;
			} catch (error) {
				console.error('localStorage error:', error);
				return initialValue;
			}
		}
		return initialValue;
	});

	const setValue = (value) => {
		if (typeof window !== 'undefined') {
			try {
				const valueToStore = value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);
				window.localStorage.setItem(key, JSON.stringify(valueToStore));
			} catch (error) {
				console.error('localStorage error:', error);
			}
		}
	};

	return [storedValue, setValue];
};
