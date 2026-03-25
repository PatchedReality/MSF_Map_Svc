/*
** Copyright 2025 Metaversal Corporation.
** 
** Licensed under the Apache License, Version 2.0 (the "License"); 
** you may not use this file except in compliance with the License. 
** You may obtain a copy of the License at 
** 
**    https://www.apache.org/licenses/LICENSE-2.0
** 
** Unless required by applicable law or agreed to in writing, software 
** distributed under the License is distributed on an "AS IS" BASIS, 
** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
** See the License for the specific language governing permissions and 
** limitations under the License.
** 
** SPDX-License-Identifier: Apache-2.0
*/

const fs            = require ('fs');
const path          = require ('path');

const Settings      = require ('./settings.json');

/*******************************************************************************************************************************
**                                                     Main                                                                   **
*******************************************************************************************************************************/

class MVSF_Map_Install_Writeout
{
   constructor ()
   {
      this.#ReadFromEnv (Settings.SQL.install, [ "db_name", "login_name" ]);
   }

   Run ()
   {
      console.log ('Installation Writeout Starting...');

      const bResult = this.#WriteSQL (
         'MSF_Map.sql',
         'MSF_Map.rendered.sql',
         [['[{MSF_Map}]', Settings.SQL.install.db_name], ['{Login_Name}', Settings.SQL.install.login_name]]
      );

      if (bResult)
         console.log ('Installation Writeout SUCCESS!!');
      else
         console.log ('Installation Writeout FAILURE!!');
   }

   #GetToken (sToken)
   {
      let sResult;

      if (typeof sToken == "string")
      {
         const match = sToken.match (/<([^>]+)>/);
         sResult = match ? match[1] : null;
      }
      else sResult = null;

      return sResult;
   }

   #ReadFromEnv (Config, aFields)
   {
      let sValue;

      for (let i=0; i < aFields.length; i++)
      {
         if ((sValue = this.#GetToken (Config[aFields[i]])) != null)
            Config[aFields[i]] = process.env[sValue];
      }
   }

   #EscapeRegExp (sToken)
   {
      return sToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   }

   #WriteSQL (sInputFilename, sOutputFilename, asToken)
   {
      let bResult = false;
      const aRegex = [];

      console.log ('Rendering (' + sInputFilename + ')...');

      try
      {
         const sInputPath = path.join (__dirname, sInputFilename);
         const sOutputPath = path.join (__dirname, sOutputFilename);
         let sTSQL = fs.readFileSync (sInputPath, 'utf8');

         for (let i=0; i < asToken.length; i++)
            aRegex.push (new RegExp (this.#EscapeRegExp (asToken[i][0]), "g"));

         for (let i=0; i < aRegex.length; i++)
            sTSQL = sTSQL.replace (aRegex[i], asToken[i][1]);

         fs.writeFileSync (sOutputPath, sTSQL, 'utf8');
         console.log ('Wrote rendered SQL to: ' + sOutputPath);
         bResult = true;
      }
      catch (err)
      {
         console.error ('Error writing SQL:', err);
      }

      return bResult;
   }
}

const g_pInstallWriteout = new MVSF_Map_Install_Writeout ();
g_pInstallWriteout.Run ();
