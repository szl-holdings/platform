import { gql, useQuery } from '@apollo/client';

const GET_VERSION = gql`
  query GetVersion {
    _version
  }
`;

export function GraphQLStatusBadge() {
  const { data, loading, error } = useQuery(GET_VERSION, {
    fetchPolicy: 'network-only',
  });

  if (loading) return null;
  if (error || !data) return null;

  return (
    <span
      title={`GraphQL API v${data._version}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: 'rgb(134 239 172)',
        opacity: 0.7,
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'rgb(134 239 172)',
          display: 'inline-block',
        }}
      />
      GQL
    </span>
  );
}
