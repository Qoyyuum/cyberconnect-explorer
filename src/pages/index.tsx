import ConnectionsTable from '@/components/ConnectionsTable';
import { isValidAddr } from '@/utils/helper';
import { useFetch } from '@/utils/hooks';
import { followListInfoQuery, recommendationListQuery, searchUserInfoQuery } from '@/utils/query';
import { FIRST, NAME_SPACE, NETWORK } from '@/utils/settings';
import theme from '@/utils/theme';
import { ConnectionsData, FollowListInfoResp, RecommendedUser, SearchUserInfoResp } from '@/utils/types';
import { Box, ChakraProvider, Flex, Heading, Input, Spinner } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ConnectionsGraph from '../components/ConnectionsGraph';


const ConnectionsPage = () => {
    const [addressInput, setAddressInput] = useState<string>("0x1dd779850b584e10e8f95b03a2a86b90b312d75d");
    const [addressInputImmediate, setAddressInputImmediate] = useState<string>("0x1dd779850b584e10e8f95b03a2a86b90b312d75d");

    const [searchAddrInfo, setSearchAddrInfo] = useState<SearchUserInfoResp | null>(null);
    const fetchSearchAddrInfo = async (toAddr: string) => {
        const resp = await searchUserInfoQuery({
            fromAddr: addressInput,
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
        useState<RecommendedUser[]>([]);
    const [address, setAddress] = useState<string>(addressInput)
    const [balanceState, invalidateBalance] = useFetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=ECK9EWNEXGYJUEAACITH3F2N8DC6GMMHS9`);

    useEffect(()=>{
        followListInfo && setAddress(followListInfo.address);
    }, [followListInfo])

    const [connections, setConnections] = useState<ConnectionsData>({data: []});
    useEffect(() => {
        // TODO: it should be done querying the info for each follower because if there are more than query maximum (FIRST=1000) it could be missing in the list
        // combine followers and following into connections
        let connections = followListInfo?.followers?.list.map((follower) => ({...follower, is_follower: true, is_following: false}));
        const following = followListInfo?.followings?.list.map((following) => ({...following, is_follower:false, is_following: true}));
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
            if (!addressInput) {
                return;
            }

        const resp = await followListInfoQuery({
            address: addressInput,
            namespace: NAME_SPACE,
            network: NETWORK,
            followingFirst: FIRST,
            followerFirst: FIRST,
        });
        if (resp) {
            setFollowListInfo(resp);
        }

        const resp2 = await recommendationListQuery({address: addressInput});
        if (resp2) {
            setRecommendedList(resp2);
        }
    };

        initFollowListInfo();
    }, [addressInput]);

    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
    function changeAddressImmediate(address: string) {
        setAddressInputImmediate(address);
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
        }
        setTimer(
            setTimeout(() => {
                changeAddress(address);
            }, 500)
        );
    }
    const changeAddress = async (value: string) => {
        setHighlightAddress(addressInput);
        setAddressInput(value);

        if (isValidAddr(value) && addressInput) {
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

    const [highlightAddress, setHighlightAddress] = useState("");
    const setHighlightCallback = useCallback((str)=>setHighlightAddress(str), []);

    return (
        <ChakraProvider theme={theme}>
            <Box p={6} backgroundColor='black' bgGradient='linear(to-tr, black, blue.800, pink.900)' height='100vh' minHeight='600px' width='100%'>
                <Flex p={6} rounded='md' margin='auto' bgColor='blackAlpha.600' direction='column' height='100%' minW='250px'>
                    <Box mb={3} flex={0}>
                        <Flex align='end' flexWrap={['wrap', 'wrap', 'nowrap']}>
                            <Box flex={2} minW='200px'>
                                <Heading as='h2' size='xs' textColor='gray.500' mt={2} mb={0}>Address: </Heading>
                                <Input name="address" bgColor='gray.700' value={addressInputImmediate} onChange={(e) => {changeAddressImmediate(e.target.value)}}></Input>
                            </Box>
                            <Box ml={3} flex={1}>
                                <Box> {
                                    address !== addressInput ? address :
                                searchAddrInfo?.identity?.ens || 'no domain for current address'
                                } </Box>
                                {balanceState.status === 'fetched' ?
                                    (balanceState.data.result / 1e18).toLocaleString('en-IN', { maximumSignificantDigits: 4 }) :
                                    <Spinner size='xs' />} &Xi;
                            </Box>
                            </Flex>
                    </Box>
                    <Flex flex={1} minHeight='300px' alignItems='stretch' gap={5}>
                        <Box flexBasis='26em' flexGrow={0}>
                            <ConnectionsTable 
                                connections={connections}
                                recommendations={recommendedList}
                                highlightAddress={highlightAddress}
                                setHighlight={setHighlightCallback}
                                changeAddress={changeAddress}
                            />
                        </Box>
                        <Box flexGrow={1} p={5} overflow='hidden' ref={graphRef}>
                            {width > 400 &&
                                <Box height='100%' width='100%' >
                                    <ConnectionsGraph address={addressInput} connections={connections} width={width} height={height} highlightAddress={highlightAddress} setHighlight={setHighlightCallback} />
                                </Box>
                            }
                        </Box>
                    </Flex>
                </Flex>
            </Box>
        </ChakraProvider>
    )
}

export default ConnectionsPage;