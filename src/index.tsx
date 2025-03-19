import { getSelectedText, ActionPanel, Action, List, closeMainWindow, openExtensionPreferences } from "@raycast/api";
// import { useFetch, Response } from "@raycast/utils";
import { useState, useEffect } from "react";
// import { URLSearchParams } from "node:url";
import { createClient } from "redis";
import { Clipboard } from "@raycast/api";
import { redisKey } from "./conf";

export type RedisClientType = ReturnType<typeof createClient>;

interface SearchResult {
  tag: string;
  value: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [redis, setRedis] = useState<RedisClientType>();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addItem = async function (tag: string) {
    // let text: string | undefined = await getSelectedText();
    // if (text === null || text === "") {
    // }
    const text: string | undefined = await Clipboard.readText();
    if (text !== null && text !== undefined) {
      if (redis) {
        redis.hSet(redisKey, tag, text);
      }
    }
    closeMainWindow();
  };

  async function removeItem(tag: string, updateData: () => void) {
    const client = createClient();
    await client.connect();
    if (client) {
      client.hDel(redisKey, tag);
    }
    updateData();
  }

  function AddListItem({ searchText }: { searchText: string }) {
    return (
      <List.Item
        title={`add: ${searchText}`}
        subtitle={"clipboard contents"}
        actions={
          <ActionPanel>
            <Action title="Add" onAction={() => addItem(searchText)} />
          </ActionPanel>
        }
      />
    );
  }

  function SearchListItem({ searchResult, updateData }: { searchResult: SearchResult; updateData: () => void }) {
    return (
      <List.Item
        title={searchResult.tag}
        detail={<List.Item.Detail markdown={searchResult.value} />}
        actions={
          <ActionPanel>
            <ActionPanel.Section>
              <Action.Paste title="Paste Value" content={searchResult.value} />
              <Action.CopyToClipboard title="Copy Tag Value" content={searchResult.value} />
            </ActionPanel.Section>
            <ActionPanel.Section>
              <Action
                title="Clear"
                onAction={() => removeItem(searchResult.tag, updateData)}
                shortcut={{ modifiers: ["cmd"], key: "." }}
              />
            </ActionPanel.Section>
          </ActionPanel>
        }
      />
    );
  }

  const setupClient = async () => {
    const client = createClient();
    await client.connect();
    setRedis(client);
  };
  if (!redis) {
    setupClient();
  }

  useEffect(() => {
    updateData();
  }, [redis, searchText]);

  //const updateSearch = async (searchText:string) => {
  //  if (client) {
  //    //list items
  //    updateData(searchText)
  //  }
  //}

  const updateData: () => void = async () => {
    setIsLoading(true);
    if (redis) {
      const results = await redis.hGetAll(redisKey);
      const searchResults = Object.entries(results).map(([key, value]) => {
        return { tag: key, value };
      });
      // return json.results.map((result) => {
      //   return {
      //     name: result.package.name,
      //     description: result.package.description,
      //     username: result.package.publisher?.username,
      //     url: result.package.links.npm,
      //   } as SearchResult;
      // });
      setResults(searchResults);
    }
    setIsLoading(false);
  };

  return (
    <List
      isShowingDetail
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search tagged clipboard items..."
      filtering={true}
    >
      <List.Section title="Results" subtitle={results?.length + ""}>
        {results?.map((searchResult) => (
          <SearchListItem key={searchResult.tag} updateData={updateData} searchResult={searchResult} />
        ))}
        <AddListItem key={"add-key"} searchText={searchText} />
      </List.Section>
    </List>
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
  tag: string;
  value: string;
}
