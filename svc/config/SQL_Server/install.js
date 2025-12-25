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
const sql           = require ('mssql/msnodesqlv8');

const Settings      = require ('./settings.json');

/*******************************************************************************************************************************
**                                                     Main                                                                   **
*******************************************************************************************************************************/

class MVSF_Map_Install
{
   constructor ()
   {
      this.#ReadFromEnv (Settings.SQL.config, [ "connectionString" ]);
   }

   async Run ()
   {
      let bResult = await this.#IsDBInstalled ();

      if (bResult == false)
      {
         console.log ('Installing Starting...');
         
//         this.#ProcessFabricConfig ();

         bResult = await this.#ExecSQL ('MSF_Map.sql', true);

         if (bResult)
            console.log ('Installation Completed...');
      }
   }

   #GetToken (sToken)
   {
      const match = sToken.match (/<([^>]+)>/);
      return match ? match[1] : null;
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

   async #ExecSQL (sFilename, bCreate)
   {
      const sSQLFile = path.join (__dirname, sFilename);
      const pConfig = { ...Settings.SQL.config };
      
      if (bCreate)
         pConfig.connectionString = pConfig.connectionString.replace (/Database=[^;]*;/i, "");  // Remove database from config to connect without it

      console.log ('Installing (' + sFilename + ')...');
     
      try 
      {
         // Read SQL file asynchronously
         const sTSQL = fs.readFileSync (sSQLFile, 'utf8');
         const statements = sTSQL.split(/^\s*GO\s*$/im);

         // Create connection
         await sql.connect (pConfig);

         for (const stmt of statements)
         {
            if (stmt.trim ())
            {
               await sql.query (stmt);
            }
         }

         await sql.close ();

         console.log ('Successfully installed (' + sFilename + ')');      
      } 
      catch (err) 
      {
         console.error ('Error executing SQL:', err.message);
      }
   }

   async #IsDBInstalled ()
   {
      const pConfig = { ...Settings.SQL.config };
      let bResult = false;
      const match = pConfig.connectionString.match(/Database=([^;]+)/i);

      if (match)
      {
         const sDB = match[1];

         pConfig.connectionString = pConfig.connectionString.replace (/Database=[^;]*;/i, "");  // Remove database from config to connect without it
         try 
         {
            // Create connection
            await sql.connect (pConfig);

            // Check if database exists
            const result = await sql.query `SELECT 1 FROM sys.databases WHERE name= ${sDB}`

            if (result.recordsets[0].length > 0)
            {
               console.log ('Database is already installed.');
               bResult = true;
            }
            else console.log ('Database does not exist.');

            await sql.close ();
         } 
         catch (err) 
         {
            console.error ('Error executing SQL:', err.message);
         } 
      }
      else console.error ('Failed to provide a Database name in the connection string');
      
      return bResult;
   }
}

const g_pInstall = new MVSF_Map_Install ();
g_pInstall.Run ();
