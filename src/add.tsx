import { LocalStorage, Form, ActionPanel, Action } from "@raycast/api";
import { Response } from "@raycast/utils";
import { useState, useEffect } from "react";
// import { URLSearchParams } from "node:url";
import { createClient } from "redis";
import { Clipboard, Toast, showToast } from "@raycast/api";
import { redisKey, CONNECTION_KEY, DEFAULT_URL } from "./conf";

export type RedisClientType = ReturnType<typeof createClient>;

export default function Command() {
  // const [searchText, setSearchText] = useState("");
  const [redis, setRedis] = useState<RedisClientType>();
  const [errored, setErrored] = useState<boolean>(false);
  const [storedConnectionString, setStoredConnectionString] = useState<string>();
  // const [results, setResults] = useState();
  // const [isLoading, setIsLoading] = useState(true);

  const setupConnectionString = async function () {
    const loadedConnString = await LocalStorage.getItem<string>(CONNECTION_KEY);
    console.log("trying to load conn string ", loadedConnString);
    if (loadedConnString) {
      console.log("conn string loaded: ", loadedConnString);
      setStoredConnectionString(loadedConnString);
    } else {
      setStoredConnectionString(DEFAULT_URL);
    }
  };

  const setupClient = async () => {
    try {
      const client = createClient({ url: storedConnectionString });
      await client.connect();
      setRedis(client);
    } catch (e) {
      setErrored(true);
      showToast({ style: Toast.Style.Failure, title: "Error", message: e.message });
      console.log(e);
    }
  };

  useEffect(() => {
    setupConnectionString();
  }, []);

  useEffect(() => {
    if (!redis && !errored) {
      setupClient();
    }
  }, [storedConnectionString]);

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
