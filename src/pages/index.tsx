import ConnectionsTable from '@/components/ConnectionsTable';
import { isValidAddr } from '@/utils/helper';
import { useFetch, useFollowListInfoQuery } from '@/utils/hooks';
import { followListInfoQuery, recommendationListQuery, searchUserInfoQuery } from '@/utils/query';
import { FIRST, NAME_SPACE, NETWORK } from '@/utils/settings';
import theme from '@/utils/theme';
import { ConnectionsData, FollowListInfoResp, RecommendationInfo, SearchUserInfoResp } from '@/utils/types';
import { Box, ChakraProvider, Flex, Heading, Input, Spinner } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ConnectionsGraph from '../components/ConnectionsGraph';


const ConnectionsPage = () => {
    const [address, setAddress] = useState<string>("0x0c493e5fb71428ba99edcb1bbccd925fdd1f48e0");

    const [balanceState, invalidateBalance] = useFetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=ECK9EWNEXGYJUEAACITH3F2N8DC6GMMHS9`);
    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const fetchSearchAddrInfo = async (toAddr: string) => {
        const resp = await searchUserInfoQuery({
            fromAddr: address,
            toAddr,
            namespace: NAME_SPACE,
            network: NETWORK,
        });
        if (resp) {
            setSearchAddrInfo(resp);
        }
    };

    const [followListInfo, setFollowListInfo] =
        useState<FollowListInfoResp | null>(null);
    const [recommendedList, setRecommendedList] =
        useState<RecommendationInfo | null>(null);

    const [connections, setConnections] = useState<ConnectionsData>({data: []});
    useEffect(() => {
        // TODO: it should be done querying the info for each follower because if there are more than query maximum (FIRST=1000) it could be missing in the list
        // combine followers and following into connections
        let connections = followListInfo?.followers.list.map((follower) => ({...follower, is_follower: true, is_following: false}));
        const following = followListInfo?.followings.list.map((following) => ({...following, is_follower:false, is_following: true}));
        following?.forEach((fing) => {
            let connection_index = connections?.findIndex((fer) => {
                return fer.address == fing.address;
            });
            if (connection_index === -1 || connection_index === undefined) {
                connections?.push(fing);
            } else {
                if(connections == undefined) {
                    connections = [];
                }
                connections[connection_index].is_following = true;
            }
        });
        if(connections !== undefined) {
            setConnections({ data: connections });
        }
    }, [followListInfo]);

    useEffect(() => {
        // Get the current user followings and followers list
        const initFollowListInfo = async () => {
            if (!address) {
                return;
            }

        const resp = await followListInfoQuery({
            address,
            namespace: NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followerFirst: FIRST,
        });
        if (resp) {
            setFollowListInfo(resp);
        }

        const resp2 = await recommendationListQuery({address});
        if (resp2) {
            setRecommendedList(resp2);
        }
    };

        initFollowListInfo();
    }, [address]);

    const changeAddress = async (value: string) => {
        setHighlightAddress(address);
        setAddress(value);

        if (isValidAddr(value) && address) {
            // setSearchLoading(true);
            await fetchSearchAddrInfo(value);
        }
    };

    const [height, setHeight] = useState(200);
    const [width, setWidth] = useState(200);
    const graphRef = useRef<HTMLDivElement | null>(null);
    const onResize = useEffect(() => {
        if (graphRef !== null && graphRef.current !== null) {
            setHeight(graphRef.current.getBoundingClientRect().height);
            setWidth(graphRef.current.getBoundingClientRect().width);
        }
        window.onresize = () => {
            if(graphRef !== null && graphRef.current !== null) {
                setHeight(graphRef.current.getBoundingClientRect().height);
                setWidth(graphRef.current.getBoundingClientRect().width);
            }
        };
    },[setWidth, setHeight, graphRef])

    const [highlightAddress, setHighlightAddress] = useState("0x80d17a81edbb64bc1f467955d5c6d92969e70f1c");
    const setHighlightCallback = useCallback((str)=>setHighlightAddress(str), []);

    return (
        <ChakraProvider theme={theme}>
            <Box p={6} backgroundColor='black' height='100vh' minHeight='500px'>
                <Flex p={6} rounded='md' margin='auto' bgColor='white' direction='column' height='100%'>
                    <Box mb={3} flex={0}>
                        <Flex align='end'>
                            <Box flex={1}>
                                <Heading as='h2' size='xs' textColor='gray.500' mt={2} mb={0}>Address: </Heading>
                                <Input name="address" bgColor='gray.300' value={address} onChange={(e) => changeAddress(e.target.value)}></Input>
                            </Box>
                            <Box ml={3} flex={1}>
                                <Box> {searchAddrInfo?.identity?.ens || 'no domain for current address'} </Box>
                                {balanceState.status === 'fetched' ?
                                    (balanceState.data.result / 1e18).toLocaleString('en-IN', { maximumSignificantDigits: 4 }) :
                                    <Spinner size='xs' />} &Xi;
                            </Box></Flex>
                    </Box>
                    <Flex flex={1} minHeight='300px' alignItems='stretch' gap={5}>
                        <Box flexBasis='26em' flexGrow={0} overflow='auto'>
                            <ConnectionsTable connections={connections} highlightAddress={highlightAddress} setHighlight={setHighlightCallback} changeAddress={changeAddress} />
                        </Box>
                        <Box flexGrow={1} display={['none', 'none', 'flex']} p={5} rounded='md' backgroundColor='white' overflow='hidden' ref={graphRef}>
                            <Box height='100%' width='100%' >
                                <ConnectionsGraph address={address} connections={connections} width={width} height={height} highlightAddress={highlightAddress} setHighlight={setHighlightCallback} />
                            </Box>
                        </Box>
                    </Flex>
                </Flex>
            </Box>
        </ChakraProvider>
    )
}

export default ConnectionsPage;