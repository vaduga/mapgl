import {DataQuery, DataQueryRequest} from "@grafana/data";

export interface QueryOptions {
    minInterval?: string;
    maxDataPoints?: number;
    liveStreaming?: boolean;
}

export interface QueryTransaction {
    id: string;
    done: boolean;
    request: DataQueryRequest;
    queries: DataQuery[];
    scanning?: boolean;
}




