import React from 'react';
import { dateTime, GrafanaTheme2 } from '@grafana/data';

export const StateTime = ({ time }) => {
  const fTime = dateTime(time).format('MMM-DD HH:mm');

  return <div>annots: {fTime}</div>;
};
