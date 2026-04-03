import { gql, useQuery, useMutation } from "@apollo/client";

export const GET_CARLOTA_SERVICES = gql`
  query GetCarlotaServices($category: String, $isActive: Boolean, $limit: Int) {
    carlotaServices(category: $category, isActive: $isActive, limit: $limit) {
      id
      slug
      name
      category
      isActive
      createdAt
    }
  }
`;

export const GET_CARLOTA_RESERVATIONS = gql`
  query GetCarlotaReservations($status: String, $limit: Int, $offset: Int) {
    carlotaReservations(status: $status, limit: $limit, offset: $offset) {
      id
      confirmationId
      service
      date
      status
      amount
      paymentStatus
      createdAt
    }
  }
`;

export const GET_CARLOTA_RESERVATION = gql`
  query GetCarlotaReservation($confirmationId: String!) {
    carlotaReservation(confirmationId: $confirmationId) {
      id
      confirmationId
      service
      date
      status
      amount
      paymentStatus
      createdAt
    }
  }
`;

export const GET_CARLOTA_INQUIRIES = gql`
  query GetCarlotaInquiries($status: String, $limit: Int, $offset: Int) {
    carlotaInquiries(status: $status, limit: $limit, offset: $offset) {
      id
      name
      service
      message
      status
      createdAt
    }
  }
`;

export const CREATE_CARLOTA_INQUIRY = gql`
  mutation CreateCarlotaInquiry($name: String!, $email: String!, $service: String!, $message: String!) {
    createCarlotaInquiry(name: $name, email: $email, service: $service, message: $message) {
      id
      name
      service
      message
      status
      createdAt
    }
  }
`;

export function useCarlotaServices(variables?: { category?: string; isActive?: boolean; limit?: number }) {
  return useQuery(GET_CARLOTA_SERVICES, { variables });
}

export function useCarlotaReservations(variables?: { status?: string; limit?: number; offset?: number }) {
  return useQuery(GET_CARLOTA_RESERVATIONS, { variables });
}

export function useCarlotaReservation(confirmationId: string) {
  return useQuery(GET_CARLOTA_RESERVATION, { variables: { confirmationId } });
}

export function useCarlotaInquiries(variables?: { status?: string; limit?: number; offset?: number }) {
  return useQuery(GET_CARLOTA_INQUIRIES, { variables });
}

export function useCreateCarlotaInquiry() {
  return useMutation(CREATE_CARLOTA_INQUIRY);
}
