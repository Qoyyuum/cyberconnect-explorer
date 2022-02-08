import { multipleFollowersQuery } from "@/utils/query";
import { ConnectionsData } from "@/utils/types";
import { Box } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

const NoSSRForceGraph = dynamic(() => import('./ForceGraph'), {
  ssr: false,
});

interface Node {
  id: string
}

interface GraphData {
  nodes: Node[],
  links: {source: string, target: string}[]
}

function genTree(cd: ConnectionsData, ownAddress: string): GraphData {
  return {
    nodes: [{id: ownAddress}].concat(cd.data.map(conn => ({id: conn.address}) )),
    links: cd.data
      .filter((conn) => conn.is_follower)
      .map((conn) => ({ source: conn.address, target: ownAddress })).concat(
        cd.data
          .filter(conn => conn.is_following)
          .map((conn) => ({ target: conn.address, source: ownAddress }))
      )
  };
}

interface ConnectionsGraphProps {
    connections: ConnectionsData;
    width: number;
    height: number;
    highlightAddress: string,
    address: string,
    setHighlight: (highlightAddress: string) => void,
}


export default function ConnectionsGraph(props: ConnectionsGraphProps) {
  const handleClick = (node:any) => {
    props.setHighlight(node.id);
  };

  const [hoverNode, setHoverNode] = useState(null);

  const handleNodeHover = (node:any) => {
        // highlightNodes.clear();
        // highlightLinks.clear();
        if (node) {
          // highlightNodes.add(node);
          // node.neighbors.forEach((neighbor:any) => highlightNodes.add(neighbor));
          // node.links.forEach((link:any) => highlightLinks.add(link));
        }

        setHoverNode(node || null);
        // updateHighlight();
      };

      const NODE_R = 4;

  const paintRing = useCallback((node, ctx) => {
    const nodeProps = props.connections.data.find((entity) => entity.address === node.id);
    // add ring just for highlighted nodes
    if (node.id === props.highlightAddress) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R * 1.8, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'gray';
      ctx.fill();
    }
    if (node.id === props.address) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R * 1.8, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'red';
      ctx.fill();
      return;
    }
    if (node === hoverNode) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R * 1.4, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
    if (nodeProps?.is_follower && nodeProps?.is_following) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R, 0.5 * Math.PI, 1.5 * Math.PI, false);
      ctx.fillStyle = 'green';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R, -0.5 * Math.PI, 0.5 * Math.PI, false);
      ctx.fillStyle = 'orange';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI, false);
      ctx.fillStyle = nodeProps?.is_follower ? 'green' : 'orange';
      ctx.fill();
    }
  }, [hoverNode, props.address, props.highlightAddress, props.connections]);

  const [loadingState, setLoadingState] = useState<string>('0/0');

  const [treeData, setTreeData] = useState<GraphData>({ nodes: [], links: [] });
  interface AdditionalConnection {
    source: any;
    target: any;
  }
  useEffect(() => {
    const removeDuplicates = (entries: AdditionalConnection[]): AdditionalConnection[] => {
      let check = new Set<string>();
      let res: AdditionalConnection[] = [];
      for (let i = 0; i < entries.length; i++) {
        const source = entries[i].source;
        const hash_source = typeof source !== 'string' && "id" in source ? source.id : source;
        const target = entries[i].target;
        const hash_target = typeof target !== 'string' && "id" in target ? target.id : target;
        
        const hash = hash_source+hash_target;
        if (!check.has(hash)) {
          check.add(hash);
          res.push(entries[i]);
        }
      }
      return res;
    }
    const orig_treeD = genTree(props.connections, props.address);
    setTreeData(orig_treeD);
    if (orig_treeD.nodes == undefined ) return;
    setLoadingState('...');
    const addresses = props.connections.data.map(entry => entry.address);
    let additionalConnections: AdditionalConnection[] = [];
    multipleFollowersQuery(addresses).then((result) => {
      if (addresses.length < 2) return;
      for (let i = 0; i < result.length; i++) {
        if(result[i].address === props.address) continue;
        let additions = result[i].followers.filter(follower => {
          return follower.address !== props.address && addresses.includes(follower.address)
        }).map(follower => ({ source: follower.address, target: result[i].address }));
        additionalConnections.push(...additions);
      }
      setTreeData((treeData) => {
        if (treeData?.nodes[0].id !== orig_treeD?.nodes[0].id) return treeData; // tree has already been updated
        return { nodes: orig_treeD.nodes, links: removeDuplicates(orig_treeD.links.concat(additionalConnections)) }
      })
      setLoadingState('');
    }); // TODO: .error
  }, [props.connections, props.address])

  return (
    <Box w='100%' h='100%' minHeight='300px'>
      <NoSSRForceGraph
        linkWidth={1}
        linkDirectionalArrowLength={2}
        width={props.width}
        height={props.height-50}
        nodeLabel='id'
        graphData={treeData}
        onNodeClick={(node)=>handleClick(node)}
        onNodeHover={handleNodeHover}
        nodeCanvasObject={paintRing}
      />
      {loadingState === '' ?
      <Box fontSize='sm'>Loading of {treeData.links.length} connections done</Box>
      : <Box fontSize='sm'>Loading connections between followers and following ... </Box>
      }
    </Box>
  );
}