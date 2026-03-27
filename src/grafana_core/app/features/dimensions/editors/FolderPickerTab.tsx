import { css } from '@emotion/css';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import * as React from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Field, FilterInput, Select, useStyles2 } from '@grafana/ui';
import { getDataSourceSrv as getDataSourceService } from '@grafana/runtime';

import { MediaType, ResourceFolderName } from '../types';
import { ResourceCards } from './ResourceCards';
import { CiscoIcons, DatabaseIcons, NetworkingIcons } from '../../../../../editor/Groups/data/iconOptions';
import { PLUGIN_ID } from '../../../../../types';

export const getDatasourceSrv = () => getDataSourceService();

const absPath = `public/plugins/${PLUGIN_ID}/img/icons/`;

export interface ResourceItem {
  label: string;
  value: string; // includes folder
  search: string;
  imgUrl: string;
}

const ciscoIconsFormatted: ResourceItem[] = CiscoIcons.map((t) => ({
  label: t,
  value: `cisco/${t}`,
  search: t.toLowerCase(),
  imgUrl: absPath + 'cisco/' + t + '.svg',
}));

const networkingIconsFormatted: ResourceItem[] = NetworkingIcons.map((t) => ({
  label: t,
  value: `networking/${t}`,
  search: t.toLowerCase(),
  imgUrl: absPath + 'networking/' + t + '.svg',
}));

const databaseIconsFormatted: ResourceItem[] = DatabaseIcons.map((t) => ({
  label: t,
  value: `databases/${t}`,
  search: t.toLowerCase(),
  imgUrl: absPath + 'databases/' + t + '.svg',
}));

const foldersMap: Partial<Record<ResourceFolderName, ResourceItem[]>> = {
  [ResourceFolderName.Cisco]: ciscoIconsFormatted,
  [ResourceFolderName.Networking]: networkingIconsFormatted,
  [ResourceFolderName.Databases]: databaseIconsFormatted,
};

const getFolders = (mediaType: MediaType): ResourceFolderName[] => {
  if (mediaType === MediaType.Icon) {
    return [
      ResourceFolderName.Networking,
      ResourceFolderName.Databases,
      ResourceFolderName.Cisco,
      ResourceFolderName.Custom,
    ];
  }
  return [ResourceFolderName.BG];
};

/**
 * Pick the folder option that matches `path` (which might be a full resource path),
 * otherwise fall back to the first option.
 */
const getFolderIfExists = (folders: Array<SelectableValue<string>>, path: string): SelectableValue<string> => {
  const substring = path.split('/').slice(0, -1).join('/'); // safer than toString()
  return folders.find((opt) => opt.value?.includes(substring)) ?? folders[0];
};

interface Props {
  value?: string;
  mediaType: MediaType;
  folderName: ResourceFolderName;
  newValue: string;
  setNewValue: Dispatch<SetStateAction<string>>;
  maxFiles?: number;
}

export const FolderPickerTab = (props: Props) => {
  const { value, mediaType, folderName, newValue, setNewValue, maxFiles } = props;
  const styles = useStyles2(getStyles);

  // Build folder options (strict: value must be string, never undefined)
  const folders = useMemo<Array<SelectableValue<string>>>(() => {
    return getFolders(mediaType).map((v) => ({
      label: v,
      value: v,
    }));
  }, [mediaType]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentFolder, setCurrentFolder] = useState<SelectableValue<string> | null>(() => {
    return getFolderIfExists(folders, value?.length ? value : folderName);
  });

  const [directoryIndex, setDirectoryIndex] = useState<ResourceItem[]>([]);
  const [filteredIndex, setFilteredIndex] = useState<ResourceItem[]>([]);

  const onChangeSearch = (query: string) => {
    const q = query?.trim().toLowerCase();
    if (q) {
      setFilteredIndex(directoryIndex.filter((card) => card.search.includes(q)));
    } else {
      setFilteredIndex(directoryIndex);
    }
  };

  // If mediaType changes, folderOptions changes too — ensure currentFolder still points to a valid option
  useEffect(() => {
    const initialPath = value?.length ? value : folderName;
    setCurrentFolder(getFolderIfExists(folders, initialPath));
  }, [folders]);

  useEffect(() => {
    const folder = currentFolder?.value;
    if (!folder) {
      setDirectoryIndex([]);
      setFilteredIndex([]);
      return;
    }

    if (folder === ResourceFolderName.Custom) {
      const filter =
        mediaType === MediaType.Icon
          ? (item: any) => item.name.endsWith('.svg')
          : (item: any) => item.name.endsWith('.png') || item.name.endsWith('.gif');

      getDatasourceSrv()
        .get('-- Grafana --')
        .then((ds: any) => {
          const f = ds.listFiles(folder.replace(/^public\//, ''), maxFiles);

          f.subscribe({
            next: (frame: any) => {
              const cards: ResourceItem[] = [];
              frame.forEach((item: any) => {
                if (filter(item) || true) {
                  const idx = item.name.lastIndexOf('.');
                  cards.push({
                    value: `${folder}/${item.name}`,
                    label: item.name,
                    search: (idx ? item.name.substring(0, idx) : item.name).toLowerCase(),
                    imgUrl: `${folder}/${item.name}`,
                  });
                }
              });

              setDirectoryIndex(cards);
              setFilteredIndex(cards);
            },
          });
        });

      //// skip parsing predefined icons from plugin folder
      return;
    }

    const cards = foldersMap[folder as ResourceFolderName] ?? [];
    setDirectoryIndex(cards);
    setFilteredIndex(cards);
  }, [mediaType, currentFolder, maxFiles]);

  return (
    <>
      <Field>
        <Select
          options={folders}
          value={currentFolder}
          onChange={setCurrentFolder}
          menuShouldPortal={true}
          classNamePrefix="folder-picker-select"
        />
      </Field>
      <Field>
        <FilterInput
          value={searchQuery ?? ''}
          placeholder="Search"
          onChange={(v) => {
            onChangeSearch(v);
            setSearchQuery(v);
          }}
        />
      </Field>
      {filteredIndex && (
        <div className={styles.cardsWrapper}>
          <ResourceCards cards={filteredIndex} onChange={(v) => setNewValue(v)} value={newValue} />
        </div>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  cardsWrapper: css({
    height: '30vh',
    minHeight: '50px',
    marginTop: '5px',
    maxWidth: '680px',
  }),
});
