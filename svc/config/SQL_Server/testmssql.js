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

const util          = require ('util');
const sql           = require ('mssql/msnodesqlv8');
const Settings      = require ('./settings.json');

class MSSQLConnectionTest
{
   #GetToken (sToken)
   {
      if (typeof sToken != 'string')
         return null;

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

   async Run ()
   {
      this.#ReadFromEnv (Settings.SQL.config, [ "connectionString" ]);
      const pConfig = { ...Settings.SQL.config };

      console.log ('Testing SQL Server connection...');

      try
      {
         await sql.connect (pConfig);
         console.log ('MSSQL connection SUCCESS');
      }
      catch (err)
      {
         console.error ('MSSQL connection FAILURE:', err);
         if (err && err.message !== undefined)
         {
            console.error ('Error message field:', err.message);
            if (typeof err.message === 'object')
               console.error ('Error message details:', util.inspect (err.message, { depth: null, colors: false }));
         }
         if (err && err.originalError)
            console.error ('Original error details:', util.inspect (err.originalError, { depth: null, colors: false }));
         process.exitCode = 1;
      }
      finally
      {
         try { await sql.close (); } catch (_err) {}
      }
   }
}

const g_pConnectionTest = new MSSQLConnectionTest ();
g_pConnectionTest.Run ();
