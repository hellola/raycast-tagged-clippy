import { Form, ActionPanel, Action } from "@raycast/api";
import { Response } from "@raycast/utils";
import { useState } from "react";
// import { URLSearchParams } from "node:url";
import { createClient } from "redis";
import { Clipboard } from "@raycast/api";
import { redisKey } from "./conf";

export type RedisClientType = ReturnType<typeof createClient>;

export default function Command() {
  // const [searchText, setSearchText] = useState("");
  const [redis, setRedis] = useState<RedisClientType>();
  // const [results, setResults] = useState();
  // const [isLoading, setIsLoading] = useState(true);
  const setupClient = async () => {
    const client = createClient();
    await client.connect();
    setRedis(client);
  };
  if (!redis) {
    setupClient();
  }

  const handleSubmit = async ({ tag }: { tag: string }) => {
    const { text } = await Clipboard.read();
    if (redis) {
      redis.hSet(redisKey, tag, text);
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Todo" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="tag" title="Tag" />
    </Form>
  );
}

/** Parse the response from the fetch query into something we can display */
// async function parseFetchResponse(response: Response) {
//   const json = (await response.json()) as
//     | {
//         results: {
//           package: {
//             name: string;
//             description?: string;
//             publisher?: { username: string };
//             links: { npm: string };
//           };
//         }[];
//       }
//     | { code: string; message: string };

//   if (!response.ok || "message" in json) {
//     throw new Error("message" in json ? json.message : response.statusText);
//   }

//   return json.results.map((result) => {
//     return {
//       name: result.package.name,
//       description: result.package.description,
//       username: result.package.publisher?.username,
//       url: result.package.links.npm,
//     } as SearchResult;
//   });
// }

interface SearchResult {
  name: string;
  description?: string;
  username?: string;
  url: string;
}
