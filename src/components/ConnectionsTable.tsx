import { useFetch, useFollowListInfoQuery } from "@/utils/hooks";
import { ConnectionData, ConnectionsData } from "@/utils/types";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Spinner, Tooltip } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import Identicon from 'react-identicons';

interface ConnectionsTableProps {
    connections: ConnectionsData,
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
            <Box ref={detailsRef} pl={10} pr={5} pb={5} key={entry.address + '_1'} bgColor='gray.300'>
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
        
    const highlightEntry = props.connections.data.find((entry) => entry.address === props.highlightAddress)
    const details_box = highlightEntry ? details(highlightEntry) : undefined;
    useEffect(() => {
        if (detailsRef !== null) {
            detailsRef.current?.scrollIntoView({block: 'center'});
        }
    }, [props.highlightAddress, props.connections])
    
    return (
        <Box key="connectionsTable">
            {props.connections.data.map(entry =>
                <Box key={entry.address}>
                <Flex
                    alignItems='center'
                    justifyContent='flex-start'
                    maxW='33em'
                    gap={0}
                    key={entry.address}
                    bgColor={props.highlightAddress == entry.address ? 'gray.300' : 'white'}
                >
                    <Box>
                        <Flex minW='4em' alignItems='center' mx={-3}>
                            <Tooltip label={entry.is_follower ? 'Is a follower.' : "Isn't a follower."} >
                                <ChevronRightIcon w={6} h={6} mr={-1} color={
                                    entry.is_follower ? 'green.400' : 'gray.400'} /></Tooltip>
                            <Identicon string={entry.address} size={15} />
                            <Tooltip label={entry.is_following ? 'Is being followed.' : "Isn't being followed."} >
                                <ChevronLeftIcon w={6} h={6} ml={-1} color={
                                    entry.is_following ? 'yellow.400' : 'gray.400'} />
                            </Tooltip>
                        </Flex>
                    </Box>
                    <Box
                        key={entry.address}
                        wordBreak='break-all'
                        fontFamily='monospace'
                        onClick={() => {invalidate(); props.setHighlight(entry.address)}}
                        cursor='pointer'
                    >
                        {entry.ens || entry.address}
                    </Box>
                </Flex>
                    {(props.highlightAddress == entry.address) && details_box }
                </Box>
            )}
        </Box>)
}

export default ConnectionsTable;