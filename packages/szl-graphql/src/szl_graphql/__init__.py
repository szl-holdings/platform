# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 SZL Holdings. Licensed under the Apache License, Version 2.0.
"""szl-graphql — unified Strawberry GraphQL gateway over the SZL flagship mesh.

Re-exports the federated schema so downstream services can mount it directly::

    from szl_graphql import schema
    from strawberry.fastapi import GraphQLRouter
    app.include_router(GraphQLRouter(schema), prefix="/graphql")

Doctrine v11 — LOCKED, verbatim: 749 declarations / 14 unique axioms / 163 sorries.
locked_at: c7c0ba17

Signed: Yachay <yachay@szlholdings.dev>
Co-Authored-By: Perplexity Computer Agent
"""
from .schema import schema  # noqa: F401

__all__ = ["schema"]
__version__ = "1.0.0"
