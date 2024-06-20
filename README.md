<p align="center">
  <img src="https://kenticoprod.azureedge.net/kenticoblob/crestron/media/crestron/generalsiteimages/crestron-logo.png">
</p>
 
# CH5 - Crestron Components library Lite (CrComLib) - Getting Started

This library is a fork of the Crestron CH5 Components Library at https://github.com/Crestron/CH5ComponentLibrary.
It does **not** have any of the web components, and is the core utilities only. 

## See Crestron developer website for documentation 
https://www.crestron.com/developer
Search for CRESTRON HTML5 USER INTERFACE 

## Activating extra information in the browser console

### For the bridge-related functions/methods

In order to display additional information, you must first enable this using the methods from Ch5Debug:
* getConfig - Returns the current configuration: all keys that can be set and their current value. A key enables debug info 
for a method/function
* loadConfig(cfg) - Loads a new config (replaces the previous one)
* enableAll() - Enables all keys. Will display all debug info available. (The debug info that uses Ch5Debug, the info 
from ch5 components, and custom attributes will not be affected)
* disablesAll() - Disables all keys
* setConfigKeyValue(key:string, value:boolean) - Changes the value of a key

