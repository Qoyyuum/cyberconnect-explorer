export interface MultipleFollowListInfoArgs {
  addresses: string[];
  namespace?: string;
  network?: string;
}

export interface FollowListInfoArgs {
  address: string;
  namespace?: string;
  network?: string;
  followingFirst?: number;
  followingAfter?: string;
  followerFirst?: number;
  followerAfter?: string;
}

export interface RecomendationListInfoArgs {
  address: string;
}

export interface MultipleFollowersQuery {
  addresses: string[];
}

export interface SearchUserInfoArgs {
  fromAddr: string;
  toAddr: string;
  namespace?: string;
  network?: string;
}

export interface RecommendedUser {
  address: string
  recommendationReason: string
}

export interface BasicUserInfo {
  ens: string;
  address: string;
  avatar: string;
}

export interface FollowListInfo {
  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
  };
  list: BasicUserInfo[];
}

export interface MultipleFollowListInfoRespEntry {
  address: string;
  followings: {address: string}[];
  followers: {address: string}[];
}

export interface FollowListInfoResp {
  address: string;
  followingCount: number;
  followerCount: number;
  followings: FollowListInfo;
  followers: FollowListInfo;
}

export interface SearchUserInfoResp {
  followStatus: {
    isFollowing: boolean;
    isFollowed: boolean;
  };
  identity: {
    ens: string;
    address: string;
    avatar: string;
  };
}

export enum Network {
  ETH = 'ETH',
  SOLANA = 'SOLANA',
}

export interface ConnectionData {
  ens: string;
  address: string;
  avatar: string;
  is_follower: boolean,
  is_following: boolean
}
export interface ConnectionsData {
  data: ConnectionData[]
}