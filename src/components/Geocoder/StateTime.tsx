import React from "react";
import {useStyles2} from "@grafana/ui";
import {dateTime, GrafanaTheme2} from "@grafana/data";
import {css} from "@emotion/css";

export const StateTime = ({time}) => {
    const s = useStyles2(getStyles);
    const fTime = dateTime(time).format('YY-MM-DD HH:mm:ss')

    return (
        <div className={s.stateTime}>
                    annots at: {fTime}
                </div>
    );
}

const getStyles = (theme: GrafanaTheme2) => ({
    stateTime: css`
        margin-bottom: 0px;
        margin-right: ${theme.spacing(1)};
        z-index: 1;               
      font-size: x-small;
      //bottom: 5px;
      //right: 1%;
      //transform: translateX(100%);
    `


})
