# Spike DynamoDB Toolbox for typing

## Trade-offs

- The obvious downside is moving away from AWS SDK, which in earnest is probably the desired way to use this.

## Alternatives

Something that I came across that seems useful but underutilized is the `translateConfig` for `DynamoDBDocumentClient` (which is not part of DynamoDB Toolbox).
