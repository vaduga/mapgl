import React from "react";
import {Checkbox} from "@grafana/ui";

const labeledCheckBox = ({children, ...args}) => {
    // style={{ marginRight: '1em', marginTop: '0.5em', paddingLeft: '5px' }}
      return (
          <label>
              <Checkbox style={{padding: 0}}{...args} />
              {children}
          </label>
      );
    }

export default labeledCheckBox






