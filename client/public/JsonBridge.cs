using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;

public class JsonBridge : MonoBehaviour
{
    public static JsonBridge Instance;

#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void SendJsonToPage(string json);

    [DllImport("__Internal")]
    private static extern string GetJsonFromPage();
#endif

    public Data gameData = new Data();

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else Destroy(gameObject);
    }

    private void Start()
    {
        ReceiveData();
    }

    public void ReceiveData()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        string json = GetJsonFromPage();
        Debug.Log("Got JSON from page: " + json);
#else
        Debug.Log("Would get JSON from page.");
#endif
    }

    // send status to platform
    // 0 = locked
    // 1 = unlocked
    // 2 = completed
    public void SendStatus(int stageId, int status)
    {
        gameData.stage_id.Add(stageId);
        gameData.status.Add(status);
        SendData();
    }

    // send badge type to platform
    // 0 = no badge
    // 1 = bronze
    // 2 = silver
    // 3 = gold
    public void SendBadge(int stageId, int badgeType)
    {
        gameData.stage_id.Add(stageId);
        gameData.badges.Add(badgeType);
        SendData();
    }

    // send high score to platform
    public void SendHighScore(int stageId, int highScore)
    {
        gameData.stage_id.Add(stageId);
        gameData.high_score.Add(highScore);
        SendData();
    }

    // send xp to platform
    public void SendXP(int stageId, int xp)
    {
        gameData.stage_id.Add(stageId);
        gameData.xp_earned.Add(xp);
        SendData();
    }

    private void SendData()
    {
        string json = JsonUtility.ToJson(gameData, true);
#if UNITY_WEBGL && !UNITY_EDITOR
        SendJsonToPage(json);
#else
        Debug.Log("Would send JSON: " + json);
#endif
    }
}

[Serializable]
public class Data
{
    public List<int> stage_id { get; set; } = new List<int>();
    public List<int> status { get; set; } = new List<int>();
    public List<int> badges { get; set; } = new List<int>();
    public List<int> high_score { get; set; } = new List<int>();
    public List<int> xp_earned { get; set; } = new List<int>();
}