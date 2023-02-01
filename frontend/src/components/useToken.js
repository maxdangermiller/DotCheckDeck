import { useState } from 'react';

function useToken() {

	function getRefToken() {
		const userToken = localStorage.getItem('ref-token');
		return userToken && userToken
	}

	function getToken() {
		const userToken = localStorage.getItem('token');
		return userToken && userToken
	}

	const [token, setToken] = useState(null);
	const [refToken, setRefToken] = useState(getRefToken());

	function saveToken(userToken) {
		localStorage.setItem('token', userToken);
		setToken(userToken);
	}

	function saveRefToken(userToken) {
		localStorage.setItem('ref-token', userToken);
		setRefToken(userToken);
	}

	function removeToken() {
		localStorage.removeItem("token");
		localStorage.removeItem("ref-token");
		setRefToken(null);
		setToken(null);
	}

	return {
		setRefToken: saveRefToken,
		setToken: saveToken,
		refToken,
		token,
		removeToken
	}

}

export default useToken;