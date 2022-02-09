import { useFetch, useFollowListInfoQuery } from "@/utils/hooks";
import theme from "@/utils/theme";
import { ConnectionData, ConnectionsData, RecommendedUser } from "@/utils/types";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Box, Button, ChakraProvider, Flex, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs, Tooltip } from "@chakra-ui/react";
import { useCallback, useEffect, useRef } from "react";
import Identicon from 'react-identicons';

interface ConnectionsTableProps {
    connections: ConnectionsData,
    recommendations: RecommendedUser[],
    highlightAddress: string,
    setHighlight: (highlightAddress: string) => void,
    changeAddress: (address: string) => void,
}

function ConnectionsTable(props : ConnectionsTableProps) {

    const [balanceState, invalidateBalance] = useFetch(`https://api.etherscan.io/api?module=account&action=balance&address=${props.highlightAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=ECK9EWNEXGYJUEAACITH3F2N8DC6GMMHS9`);
    const [userInfo, invalidateUserInfo] = useFollowListInfoQuery(props.highlightAddress);
    const invalidate = () => {
        invalidateBalance();
        invalidateUserInfo();
    }

    const detailsRef = useRef<HTMLDivElement | null>(null);
    const details = (entry:ConnectionData) => 
            <Box ref={detailsRef} pl={10} pr={5} pb={5} key={entry.address + '_1'}>
                <Box float='right'>
                    {balanceState.status === 'fetched' ?
                        (balanceState.data.result / 1e18).toLocaleString('en-IN', { maximumSignificantDigits: 4 }) :
                        <Spinner size='xs' />} &Xi;
                </Box>
                {(entry.ens ? <Box fontSize='sm'>{entry.address.slice(0,8) + '...' + entry.address.slice(-9,-1)}</Box> : <Box fontSize='sm'>no domain info available</Box>)}
                <Box style={{ clear: 'both' }} float='right' fontSize='sm'>
                    <ChevronLeftIcon w={6} h={6} color={'yellow.400'} />
                    {userInfo?.status === 'fetched' ?
                        userInfo?.data.followingCount + ' '
                        : <Spinner size='xs' mr={2} />
                    }
                    Following
                </Box>
                <Box fontSize='sm'>
                    <ChevronRightIcon w={6} h={6} color={'green.400'} />
                    {userInfo?.status === 'fetched' ?
                        userInfo?.data.followerCount + ' '
                        : <Spinner size='xs' mr={2} />
                    }
                    Followers
                </Box>
                <Box style={{ clear: 'both' }}>
                    <Button size='sm' onClick={() => { props.changeAddress(props.highlightAddress); }}>Search this address.</Button>
                </Box>
            </Box>

    interface EntryData {
        ens?: string;
        address: string;
        is_follower?: boolean,
        is_following?: boolean,
        recommendation_reason?: string
    }
    const UserEntry = useCallback(((props: { entry: EntryData}) => {
        const entry = props.entry;
        return (
            <Flex
                alignItems='center'
                justifyContent='flex-start'
                maxW='33em'
                gap={0}
                key={entry.address}
            >
                <Box key='header'>
                    <Flex minW='fit-content' mx={1} alignItems='center' >
                        {entry.is_follower !== undefined &&
                            <Tooltip label={entry.is_follower ? 'Is a follower.' : "Isn't a follower."} >
                                <ChevronRightIcon w={6} h={6} ml={-2} mr={-2} color={
                                    entry.is_follower ? 'green.400' : 'gray.400'} /></Tooltip>
                        }
                        <Identicon string={entry.address} size={15} />
                        {entry.is_following !== undefined &&
                            <Tooltip label={entry.is_following ? 'Is being followed.' : "Isn't being followed."} >
                                <ChevronLeftIcon w={6} h={6} ml={-2} mr={-2} color={
                                    entry.is_following ? 'yellow.400' : 'gray.400'} />
                            </Tooltip>
                        }
                    </Flex>
                </Box>
                <Box
                    key={entry.address}
                    wordBreak='break-all'
                    fontFamily='monospace'
                    cursor='pointer'
                >
                    {entry.ens || entry.address}
                </Box>
            </Flex>
        )
    }),[]);

    const highlightEntry = props.connections.data.find((entry) => entry.address === props.highlightAddress)
    const details_box = highlightEntry ? details(highlightEntry) : undefined;
    useEffect(() => {
        if (detailsRef !== null) {
            detailsRef.current?.scrollIntoView({block: 'center'});
        }
    }, [props.highlightAddress, props.connections])
    
    return (
        <ChakraProvider theme={theme}>
        <Tabs height='100%' display='flex' flexDir='column' p={0}>
            <TabList flex={0} flexWrap='wrap'>
                <Tab>Connections</Tab>
                <Tab>Recommendations</Tab>
            </TabList>

                <TabPanels overflow='auto' flex={1} sx={{
                    '&::-webkit-scrollbar': {
                        width: '16px',
                        borderRadius: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: `rgba(255, 255, 255, 80)`,
                    },
                }}>
                <TabPanel p={1}>
                    <Box key="connectionsTable">
                        {props.connections.data.map(entry =>
                            <Box key={entry.address + '_user'}
                                onClick={() => { invalidate(); props.setHighlight(entry.address) }}
                            >
                                <UserEntry entry={entry} />
                                {(props.highlightAddress == entry.address) && details_box}
                            </Box>
                        )}
                    </Box>
                </TabPanel>
                <TabPanel p={1}>
                    {props.recommendations.map(entry =>
                        <Box key={entry.address + '_user'}
                            onClick={() => { invalidate(); props.setHighlight(entry.address) }}
                        >
                            <UserEntry entry={entry} />
                            {(props.highlightAddress.replace(/^{0x}+/, '') === entry.address.replace(/^{0x}+/, '')) && 
                                <Box pl={6} pr={5} pb={2} mt={-1} fontSize='sm'>Reason: {entry.recommendationReason}</Box>
                            }
                        </Box>
                    )}
                </TabPanel>
            </TabPanels>
        </Tabs></ChakraProvider>)
}

export default ConnectionsTable;