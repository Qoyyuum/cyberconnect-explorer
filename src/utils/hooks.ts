import { useEffect, useRef, useReducer } from 'react';
import { isValidAddr } from './helper';
import { followListInfoQuery } from './query';
import { FIRST, NAME_SPACE, NETWORK } from './settings';
import { FollowListInfoArgs, FollowListInfoResp } from './types';

// explanation: https://www.smashingmagazine.com/2020/07/custom-react-hook-fetch-cache-data/
export const useFetch = (url: string) => {
	const cache = useRef<Record<string, any>>({});

	const initialState = {
		status: 'idle',
		error: null,
		data: [],
	};

	const [state, dispatch] = useReducer((state:any, action: any) => {
		switch (action.type) {
            case 'INVALIDATE': 
                return { ...initialState};
			case 'FETCHING':
				return { ...initialState, status: 'fetching' };
			case 'FETCHED':
				return { ...initialState, status: 'fetched', data: action.payload };
			case 'FETCH_ERROR':
				return { ...initialState, status: 'error', error: action.payload };
			default:
				return state;
		}
	}, initialState);

	useEffect(() => {
		let cancelRequest = false;
		if (!url || !url.trim()) return;

		const fetchData = async () => {
			dispatch({ type: 'FETCHING' });
			if (cache.current[url]) {
				const data = cache.current[url];
				dispatch({ type: 'FETCHED', payload: data });
			} else {
				try {
					const response = await fetch(url);
					const data = await response.json();
					cache.current[url] = data;
					if (cancelRequest) return;
					dispatch({ type: 'FETCHED', payload: data });
				} catch (error: any) {
					if (cancelRequest) return;
					dispatch({ type: 'FETCH_ERROR', payload: error.message || 'no error message' });
				}
			}
		};

		fetchData();

		return function cleanup() {
			cancelRequest = true;
		};
	}, [url]);

	return [state, () => dispatch({ type: 'INVALIDATE', payload: undefined })];
};

export const useFollowListInfoQuery = (address: string) => {
	const cache = useRef<Record<string, any>>({});

	const initialState = {
		status: 'idle',
		error: null,
		data: [],
	};

	const [state, dispatch] = useReducer((state:any, action: any) => {
		switch (action.type) {
            case 'INVALIDATE': 
                return { ...initialState};
			case 'FETCHING':
				return { ...initialState, status: 'fetching' };
			case 'FETCHED':
				return { ...initialState, status: 'fetched', data: action.payload };
			case 'FETCH_ERROR':
				return { ...initialState, status: 'error', error: action.payload };
			default:
				return state;
		}
	}, initialState);

	useEffect(() => {
		let cancelRequest = false;
        if (! isValidAddr(address)) return;

		const fetchData = async () => {
			dispatch({ type: 'FETCHING' });
			if (cache.current[address]) {
				const data = cache.current[address];
				dispatch({ type: 'FETCHED', payload: data });
			} else {
				try {
                    const response = await followListInfoQuery({
                        address,
                        namespace: NAME_SPACE,
                        network: NETWORK,
                        followingFirst: FIRST,
                        followerFirst: FIRST,
                    });
					cache.current[address] = response;
					if (cancelRequest) return;
					dispatch({ type: 'FETCHED', payload: response });
				} catch (error: any) {
					if (cancelRequest) return;
					dispatch({ type: 'FETCH_ERROR', payload: error.message || 'no error message' });
				}
			}
		};

		fetchData();

		return function cleanup() {
			cancelRequest = true;
		};
	}, [address]);

	return [state, () => dispatch({ type: 'INVALIDATE', payload: undefined })];
};