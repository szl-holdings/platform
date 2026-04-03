import { gql, useQuery, useMutation } from "@apollo/client";

export const GET_HOLDINGS_VENTURES = gql`
  query GetHoldingsVentures($status: String, $limit: Int, $offset: Int) {
    holdingsVentures(status: $status, limit: $limit, offset: $offset) {
      id
      slug
      name
      status
      sector
      createdAt
    }
  }
`;

export const GET_HOLDINGS_VENTURE_BY_SLUG = gql`
  query GetHoldingsVentureBySlug($slug: String!) {
    holdingsVentureBySlug(slug: $slug) {
      id
      slug
      name
      status
      sector
      createdAt
    }
  }
`;

export const GET_HOLDINGS_METRICS = gql`
  query GetHoldingsMetrics($ventureId: ID!, $limit: Int) {
    holdingsMetrics(ventureId: $ventureId, limit: $limit) {
      id
      ventureId
      label
      value
      change
      period
      createdAt
    }
  }
`;

export const GET_HOLDINGS_MILESTONES = gql`
  query GetHoldingsMilestones($ventureId: ID!, $limit: Int) {
    holdingsMilestones(ventureId: $ventureId, limit: $limit) {
      id
      ventureId
      title
      date
      category
      createdAt
    }
  }
`;

export const CREATE_HOLDINGS_INQUIRY = gql`
  mutation CreateHoldingsInquiry($name: String!, $email: String!, $subject: String!, $message: String!) {
    createHoldingsInquiry(name: $name, email: $email, subject: $subject, message: $message) {
      id
      name
      email
      subject
      status
      createdAt
    }
  }
`;

export function useHoldingsVentures(variables?: { status?: string; limit?: number; offset?: number }) {
  return useQuery(GET_HOLDINGS_VENTURES, { variables });
}

export function useHoldingsVentureBySlug(slug: string) {
  return useQuery(GET_HOLDINGS_VENTURE_BY_SLUG, { variables: { slug } });
}

export function useHoldingsMetrics(ventureId: string, limit?: number) {
  return useQuery(GET_HOLDINGS_METRICS, { variables: { ventureId, limit } });
}

export function useHoldingsMilestones(ventureId: string, limit?: number) {
  return useQuery(GET_HOLDINGS_MILESTONES, { variables: { ventureId, limit } });
}

export function useCreateHoldingsInquiry() {
  return useMutation(CREATE_HOLDINGS_INQUIRY);
}
