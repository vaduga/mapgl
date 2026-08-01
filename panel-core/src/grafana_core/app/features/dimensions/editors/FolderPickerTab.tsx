import { css } from '@emotion/css';
import React, { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { type Subscription } from 'rxjs';

import { type GrafanaTheme2, type SelectableValue } from '@grafana/data';
import { Field, FilterInput, useStyles2 } from '@grafana/ui';
import { getDataSourceSrv as getDataSourceService } from '@grafana/runtime';

import { FolderPickerSelectCompat } from '../../../../../components/Compat/ResourcePickerCompat';
import { MediaType, ResourceFolderName } from '../types';
import { ResourceCards } from './ResourceCards';
import { CiscoIcons, DatabaseIcons, NetworkingIcons } from '../../../../../editor/Groups/data/iconOptions';
import { getMapglPluginId } from '../../../../../pluginFactory/pluginRuntime';
import { t } from '@mapgl/panel-core/utils/i18n';

export const getDatasourceSrv = () => getDataSourceService();

export interface ResourceItem {
  label: string;
  value: string; // includes folder
  search: string;
  imgUrl: string;
}

type FileElement = {
  name: string;
};

type GrafanaDatasource = {
  listFiles: (
    folder: string,
    maxFiles?: number
  ) => {
    subscribe: (observer: { next: (frame: FileElement[]) => void }) => Subscription;
  };
};

const createPluginIconItems = (folder: string, names: string[]): ResourceItem[] =>
  names.map((name) => ({
    label: name,
    value: `${folder}/${name}`,
    search: name.toLowerCase(),
    imgUrl: `public/plugins/${getMapglPluginId()}/img/icons/${folder}/${name}.svg`,
  }));

const getFoldersMap = (): Partial<Record<ResourceFolderName, ResourceItem[]>> => ({
  [ResourceFolderName.Cisco]: createPluginIconItems('cisco', CiscoIcons),
  [ResourceFolderName.Networking]: createPluginIconItems('networking', NetworkingIcons),
  [ResourceFolderName.Databases]: createPluginIconItems('databases', DatabaseIcons),
});

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
      return undefined;
    }

    if (folder === ResourceFolderName.Custom) {
      const filter =
        mediaType === MediaType.Icon
          ? (item: FileElement) => item.name.endsWith('.svg')
          : (item: FileElement) => item.name.endsWith('.png') || item.name.endsWith('.gif');

      let cancelled = false;
      let subscription: Subscription | undefined;
      getDatasourceSrv()
        .get('-- Grafana --')
        .then((ds) => {
          if (cancelled) {
            return;
          }

          const f = (ds as unknown as GrafanaDatasource).listFiles(folder.replace(/^public\//, ''), maxFiles);

          subscription = f.subscribe({
            next: (frame) => {
              if (cancelled) {
                return;
              }

              const cards: ResourceItem[] = [];
              frame.forEach((item) => {
                if (filter(item)) {
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
      return () => {
        cancelled = true;
        subscription?.unsubscribe();
      };
    }

    const cards = getFoldersMap()[folder as ResourceFolderName] ?? [];
    setDirectoryIndex(cards);
    setFilteredIndex(cards);
    return undefined;
  }, [mediaType, currentFolder, maxFiles]);

  return (
    <>
      <Field>
        <FolderPickerSelectCompat
          options={folders}
          onChange={(folder) => {
            // Clear the grid immediately so it stays empty until the new folder's icons load,
            // rather than showing the previous folder's icons during the request.
            setDirectoryIndex([]);
            setFilteredIndex([]);
            setCurrentFolder(folder);
          }}
          value={currentFolder}
          aria-label={t('dimensions.folder-picker-tab.label-folder', 'Folder')}
        />
      </Field>
      <Field>
        <FilterInput
          value={searchQuery ?? ''}
          placeholder={t('dimensions.folder-picker-tab.placeholder-search', 'Search')}
          escapeRegex={false}
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
