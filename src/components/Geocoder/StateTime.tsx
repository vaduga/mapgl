import React from "react";
import {dateTime, GrafanaTheme2} from "@grafana/data";

export const StateTime = ({time}) => {

    const fTime = dateTime(time).format('YY-MM-DD HH:mm:ss')

    return (
        <div>
                    annots at: {fTime}
                </div>
    );
}


