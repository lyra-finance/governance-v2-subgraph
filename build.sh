#!/bin/bash
network='goerli'

GRAPH=${GRAPH:-graph}

graphNetwork=$network

NETWORK=$graphNetwork $GRAPH codegen -o generated 
NETWORK=$graphNetwork $GRAPH build 
