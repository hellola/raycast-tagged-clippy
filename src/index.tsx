import { LocalStorage, getSelectedText, ActionPanel, Action, List, closeMainWindow } from "@raycast/api";
import { useState, useEffect } from "react";
import { createClient } from "redis";
import { Clipboard, Toast, showToast } from "@raycast/api";
import { redisKey, CONNECTION_KEY, DEFAULT_URL } from "./conf";

export type RedisClientType = ReturnType<typeof createClient>;

interface SearchResult {
  tag: string;
  value: string;
}

export default async function Command() {
  const [searchText, setSearchText] = useState("");
  const [redis, setRedis] = useState<RedisClientType>();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errored, setErrored] = useState<boolean>(false);

  const [storedConnectionString, setStoredConnectionString] = useState<string>("");

  const setupConnectionString = async function () {
    const loadedConnString = await LocalStorage.getItem<string>(CONNECTION_KEY);
    console.log("trying to load conn string ", loadedConnString);
    if (loadedConnString) {
      console.log("conn string loaded: ", loadedConnString);
      setStoredConnectionString(loadedConnString);
      return loadedConnString;
    } else {
      setStoredConnectionString(DEFAULT_URL);
      return DEFAULT_URL;
    }
  };

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

  const storeConnectionString = async function () {
    // let text: string | undefined = await getSelectedText();
    // if (text === null || text === "") {
    // }
    const text: string | undefined = await Clipboard.readText();
    if (text !== null && text !== undefined) {
      const result = await LocalStorage.setItem(CONNECTION_KEY, text);
      console.log(result);
      closeMainWindow();

      // if (redis) {
      //   redis.hSet(redisKey, tag, text);
      // }
    }
    //closeMainWindow();
  };

  async function removeItem(tag: string, updateData: () => void) {
    if (redis) {
      redis.hDel(redisKey, tag);
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
    if (storedConnectionString == "") {
      setupConnectionString().then((loaded) => {
        showToast({ style: Toast.Style.Success, title: "setup conn string", message: loaded });
      });
    }

    if (storedConnectionString != "" && !redis) {
      setupClient();
      showToast({ style: Toast.Style.Success, title: "Using Connection", message: storedConnectionString });
    }
    if (storedConnectionString != "" && redis && results.length == 0) {
      updateData();
    }
  }, [storedConnectionString]);

  // useEffect(() => {
  //   updateData();
  // }, [redis, searchText]);

  //const updateSearch = async (searchText:string) => {
  //  if (client) {
  //    //list items
  //    updateData(searchText)
  //  }
  //}

  const updateData: () => void = async () => {
    setIsLoading(true);
    if (redis) {
      const res = await redis.hGetAll(redisKey);
      const searchResults = Object.entries(res).map(([key, value]) => {
        return { tag: key, value };
      });
      showToast({ style: Toast.Style.Success, title: "Updated Data", message: JSON.stringify(searchResults[0]) });
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
        <List.Item
          key={"config-entry"}
          title={`change connection string`}
          subtitle={"uses clipboard contents"}
          actions={
            <ActionPanel>
              <Action title="Settings" onAction={storeConnectionString} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

interface SearchResult {
  tag: string;
  value: string;
}
