import { gql, useMutation, useQuery } from '@apollo/client';

export const GET_TERRA_DISTRESS_PROPERTIES = gql`
  query GetTerraDistressProperties($borough: String, $distressType: String, $limit: Int, $offset: Int) {
    terraDistressProperties(borough: $borough, distressType: $distressType, limit: $limit, offset: $offset) {
      id
      address
      borough
      distressType
      opportunityScore
      auctionDate
      createdAt
    }
  }
`;

export const GET_TERRA_DEALS = gql`
  query GetTerraDeals($stage: String, $limit: Int, $offset: Int) {
    terraDeals(stage: $stage, limit: $limit, offset: $offset) {
      id
      address
      stage
      price
      probability
      distressPropertyId
      createdAt
    }
  }
`;

export const GET_TERRA_LEADS = gql`
  query GetTerraLeads($stage: String, $limit: Int, $offset: Int) {
    terraLeads(stage: $stage, limit: $limit, offset: $offset) {
      id
      firstName
      lastName
      type
      score
      stage
      createdAt
    }
  }
`;

export const GET_TERRA_LISTINGS = gql`
  query GetTerraListings($status: String, $limit: Int, $offset: Int) {
    terraListings(status: $status, limit: $limit, offset: $offset) {
      id
      propertyId
      agentId
      listPrice
      status
      daysOnMarket
      createdAt
    }
  }
`;

export const UPDATE_TERRA_DEAL = gql`
  mutation UpdateTerraDeal($id: ID!, $stage: String, $probability: Int) {
    updateTerraDeal(id: $id, stage: $stage, probability: $probability) {
      id
      address
      stage
      price
      probability
      createdAt
    }
  }
`;

export const CREATE_TERRA_LEAD = gql`
  mutation CreateTerraLead($firstName: String!, $lastName: String!, $type: String) {
    createTerraLead(firstName: $firstName, lastName: $lastName, type: $type) {
      id
      firstName
      lastName
      type
      score
      stage
      createdAt
    }
  }
`;

export function useTerraDistressProperties(variables?: {
  borough?: string;
  distressType?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery(GET_TERRA_DISTRESS_PROPERTIES, { variables });
}

export function useTerraDeals(variables?: { stage?: string; limit?: number; offset?: number }) {
  return useQuery(GET_TERRA_DEALS, { variables });
}

export function useTerraLeads(variables?: { stage?: string; limit?: number; offset?: number }) {
  return useQuery(GET_TERRA_LEADS, { variables });
}

export function useTerraListings(variables?: { status?: string; limit?: number; offset?: number }) {
  return useQuery(GET_TERRA_LISTINGS, { variables });
}

export function useUpdateTerraDeal() {
  return useMutation(UPDATE_TERRA_DEAL);
}

export function useCreateTerraLead() {
  return useMutation(CREATE_TERRA_LEAD);
}
