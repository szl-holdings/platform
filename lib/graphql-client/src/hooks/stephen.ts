import { gql, useQuery, useMutation } from "@apollo/client";

export const GET_STEPHEN_CONTENT_BLOCKS = gql`
  query GetStephenContentBlocks($type: String, $featured: Boolean, $limit: Int, $offset: Int) {
    stephenContentBlocks(type: $type, featured: $featured, limit: $limit, offset: $offset) {
      id
      type
      title
      content
      featured
      createdAt
    }
  }
`;

export const GET_STEPHEN_CASE_STUDIES = gql`
  query GetStephenCaseStudies($featured: Boolean, $limit: Int, $offset: Int) {
    stephenCaseStudies(featured: $featured, limit: $limit, offset: $offset) {
      id
      title
      slug
      summary
      outcome
      featured
      createdAt
    }
  }
`;

export const GET_STEPHEN_CASE_STUDY = gql`
  query GetStephenCaseStudy($slug: String!) {
    stephenCaseStudy(slug: $slug) {
      id
      title
      slug
      summary
      outcome
      featured
      createdAt
    }
  }
`;

export const CREATE_STEPHEN_BOOKING = gql`
  mutation CreateStephenBookingRequest($name: String!, $email: String!, $type: String!) {
    createStephenBookingRequest(name: $name, email: $email, type: $type) {
      id
      name
      email
      type
      status
      createdAt
    }
  }
`;

export function useStephenContentBlocks(variables?: { type?: string; featured?: boolean; limit?: number; offset?: number }) {
  return useQuery(GET_STEPHEN_CONTENT_BLOCKS, variables !== undefined ? { variables } : {});
}

export function useStephenCaseStudies(variables?: { featured?: boolean; limit?: number; offset?: number }) {
  return useQuery(GET_STEPHEN_CASE_STUDIES, variables !== undefined ? { variables } : {});
}

export function useStephenCaseStudy(slug: string) {
  return useQuery(GET_STEPHEN_CASE_STUDY, { variables: { slug } });
}

export function useCreateStephenBooking() {
  return useMutation(CREATE_STEPHEN_BOOKING);
}
